const { PrismaClient } = require("@prisma/client");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const fs = require("fs");
const path = require("path");
const nodeCrypto = require("crypto");

console.log("Ingest script started");

const prisma = new PrismaClient();

/**
 * Generates a random ID compatible with Prisma's cuid format
 * Uses crypto.randomBytes for better compatibility across Node.js versions
 */
function generateId(): string {
    // Generate a random string similar to cuid format
    // cuid format: c + timestamp + counter + random, but we'll use a simpler approach
    const randomBytes = nodeCrypto.randomBytes(16).toString("hex");
    return "c" + Date.now().toString(36) + randomBytes.substring(0, 24);
}

/**
 * Formats a vector array for pgvector insertion
 * pgvector expects the format: '[1,2,3]' as a string
 */
function formatVectorForPgVector(vector: number[]): string {
    return `[${vector.join(",")}]`;
}

async function ingest() {
    const notesPath = path.join(process.cwd(), "notes");
    console.log("Notes path:", notesPath);

    const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN", status: "ACTIVE" },
    });

    if (!adminUser) {
        throw new Error("No ADMIN user found");
    }

    const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT", status: "ACTIVE" },
    });

    if (!studentUser) {
        throw new Error("No STUDENT user found");
    }

    const files = fs.readdirSync(notesPath);
    console.log("Files found:", files);

    const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
    });

    for (const file of files) {
        const filePath = path.join(notesPath, file);
        const content = fs.readFileSync(filePath, "utf8");

        const chunks = await splitter.splitText(content);
        console.log(`Chunks for ${file}:`, chunks.length);

        const note = await prisma.studentNote.create({
            data: {
                studentId: studentUser.id,
                teacherId: adminUser.id,
                title: file,
                content: content.substring(0, 1000),
                fileName: file,
                fileType: path.extname(file).slice(1).toUpperCase() || "TXT",
            },
        });

        // Generate all embeddings for this note
        const embeddingVectors = await embeddings.embedDocuments(chunks);
        console.log(`Generated ${embeddingVectors.length} embeddings for ${file}`);

        // Insert embeddings using raw SQL (required for pgvector with Prisma)
        // Prisma doesn't generate CRUD methods for models with Unsupported("vector") fields
        for (let i = 0; i < chunks.length; i++) {
            const vector = embeddingVectors[i];
            const vectorString = formatVectorForPgVector(vector);
            const embeddingId = generateId();

            // Use raw SQL to insert vector data
            // pgvector requires the vector to be formatted as '[1,2,3]' string and cast to vector type
            await prisma.$executeRawUnsafe(
                `INSERT INTO "NoteEmbedding" (id, "noteId", content, embedding, "chunkIndex", "createdAt")
                 VALUES ($1, $2, $3, $4::vector, $5, NOW())`,
                embeddingId,
                note.id,
                chunks[i],
                vectorString,
                i
            );
        }

        console.log(`Saved ${chunks.length} embeddings for ${file}`);
    }

    console.log("Ingest completed");
}

ingest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
