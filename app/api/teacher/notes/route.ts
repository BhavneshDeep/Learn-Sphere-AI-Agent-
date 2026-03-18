import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { extractTextFromPDF, chunkText, generateEmbeddings } from "@/lib/embeddings"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER" ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notes = await prisma.studentNote.findMany({
      where: { teacherId: token.id as string },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ notes }, { status: 200 })
  } catch (error) {
    console.error("Get notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}


// POST handler for creating a new note it will uploads the file to local storage and create DB record and generate embeddings
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const studentId = formData.get("studentId") as string
    const title = formData.get("title") as string
    const content = formData.get("content") as string | null
    const file = formData.get("file") as File | null

    if (!studentId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null
    let filePath: string | null = null

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      fileName = `${timestamp}_${originalName}`
      filePath = join(uploadsDir, fileName)

      await writeFile(filePath, buffer)

      fileUrl = `/uploads/${fileName}`
      fileType = file.type || file.name.split(".").pop() || "unknown"
    }

    // Handle "all students" case
    if (studentId === "all") {
      // Fetch all active students
      const allStudents = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          status: "ACTIVE",
          deletedAt: null,
        },
        select: {
          id: true,
        },
      })

      if (allStudents.length === 0) {
        return NextResponse.json({ error: "No students found" }, { status: 404 })
      }

      // Extract text content first (for storage and embeddings)
      let extractedText: string | null = null
      if (file) {
        extractedText = await extractAndStoreText(title, content, filePath, fileType || undefined)
      } else if (content) {
        extractedText = `Title: ${title}\n\nContent: ${content}`
      }

      // Create notes for all students and generate embeddings
      const createdNotes = []
      for (const student of allStudents) {
        const note = await prisma.studentNote.create({
          data: {
            studentId: student.id,
            teacherId: token.id as string,
            title,
            content: content || null,
            extractedText,
            fileUrl,
            fileName,
            fileType,
          },
        })

        // Generate embeddings for this note (async, don't wait)
        generateNoteEmbeddings(note.id, title, content, filePath, extractedText).catch((error) => {
          console.error("Error generating embeddings:", error)
        })

        createdNotes.push(note)
      }

      return NextResponse.json(
        { message: `Note sent to ${createdNotes.length} students`, count: createdNotes.length },
        { status: 201 }
      )
    }

    // Extract text content first (for storage and embeddings)
    let extractedText: string | null = null
    if (file) {
      const filePath = join(process.cwd(), "public", "uploads", fileName as string)
      extractedText = await extractAndStoreText(title, content, filePath, fileType || undefined)
    } else if (content) {
      extractedText = `Title: ${title}\n\nContent: ${content}`
    }

    // Handle single student case
    const note = await prisma.studentNote.create({
      data: {
        studentId,
        teacherId: token.id as string,
        title,
        content: content || null,
        extractedText,
        fileUrl,
        fileName,
        fileType,
      },
    })

    // Generate embeddings for this note (async, don't wait)
    generateNoteEmbeddings(note.id, title, content, file ? join(process.cwd(), "public", "uploads", fileName as string) : null, extractedText).catch(
      (error) => {
        console.error("Error generating embeddings:", error)
      }
    )

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error("Create note error:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

// Helper function to extract and store text content from files
async function extractAndStoreText(
  title: string,
  content: string | null,
  filePath: string | null,
  fileExtension?: string
): Promise<string> {
  let fullText = `Title: ${title}\n\n`

  // Add content if available
  if (content) {
    fullText += `Content: ${content}\n\n`
  }

  // Extract text from file if it exists
  if (filePath) {
    try {
      const fileExt = fileExtension || filePath.split(".").pop()?.toLowerCase() || ""
      
      if (fileExt === "pdf" || filePath.endsWith(".pdf")) {
        const pdfText = await extractTextFromPDF(filePath)
        fullText += `PDF Content: ${pdfText}`
      } else if (["txt", "md", "html", "htm"].includes(fileExt)) {
        const textContent = await readFile(filePath, "utf-8")
        fullText += `File Content: ${textContent}`
      }
    } catch (error) {
      console.error("Error extracting file text:", error)
      // Continue without file text
    }
  }

  return fullText
}

// Helper function to generate embeddings for a note
async function generateNoteEmbeddings(
  noteId: string,
  title: string,
  content: string | null,
  filePath: string | null,
  extractedText?: string | null
): Promise<void> {
  try {
    // Always generate embeddings using local model (no API key needed)

    // Use stored extractedText if available, otherwise extract from file
    let fullText: string
    if (extractedText) {
      fullText = extractedText
    } else {
      fullText = await extractAndStoreText(title, content, filePath)
      
      // Update the note with extracted text for future use
      await prisma.studentNote.update({
        where: { id: noteId },
        data: { extractedText: fullText },
      })
    }

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200)

    if (chunks.length === 0) {
      console.log(`No chunks generated for note ${noteId} - text might be empty`)
      return
    }

    console.log(`Generating ${chunks.length} embeddings for note ${noteId}`)

    // Delete existing embeddings for this note (in case of regeneration)
    const deletedCount = await prisma.noteEmbedding.deleteMany({
      where: { noteId },
    })
    if (deletedCount.count > 0) {
      console.log(`Deleted ${deletedCount.count} old embeddings for note ${noteId}`)
    }

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks)

    console.log(`Generated ${embeddings.length} embeddings, storing in database...`)

    // Store embeddings in database
    await prisma.noteEmbedding.createMany({
      data: chunks.map((chunk, index) => ({
        noteId,
        content: chunk,
        embedding: embeddings[index],
        chunkIndex: index,
      })),
    })

    console.log(`Successfully stored embeddings for note ${noteId}`)
  } catch (error) {
    console.error("Error generating note embeddings:", error)
    // Don't throw - embedding generation failure shouldn't break note creation
  }
}



/*
Teacher Notes & Embeddings – Short Version

Teacher uploads a note (title, content, PDF/TXT/MD/HTML) → sent to /api/teacher/notes.

API saves file in public/uploads and creates a studentNote record in DB.

Extract text from the note (title + content + file) → stored as extractedText.

Split text into chunks (~1000 chars with 200 overlap).

Generate embeddings for each chunk → numerical vectors representing meaning.

Store embeddings in noteEmbedding table with chunkIndex.

Student asks a question → convert query to embedding → compare with note embeddings → return top relevant chunks.

Fallback: If embeddings fail, use keyword-based text search.

*/