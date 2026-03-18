import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs"
import path from "path"
import pdfParse from "pdf-parse"
export const runtime = "nodejs"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function fileToGenerativePart(filePath: string, mimeType: string) {
  const fileBuffer = fs.readFileSync(filePath)
  return {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType,
    },
  }
}

function getMimeType(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case ".pdf":
      return "application/pdf"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    default:
      return null
  }
}

function buildJsonInstruction(count: number, topic: string, difficulty: string) {
  return `
You are an expert teacher.
Generate ${count} multiple-choice practice questions (MCQs) based on the provided content.

Focus topic: ${topic}
Difficulty level: ${difficulty}

Output STRICTLY as a JSON array of objects. Each object must have:
- question: string
- options: array of 4 distinct string options
- correctAnswer: string (must be one of the options)
- explanation: string (brief)
- topic: string
- difficulty: string ("Easy", "Medium", or "Hard")

Do not wrap the JSON in markdown. Return raw JSON only.
`.trim()
}

function stripMarkdownCodeFences(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim()
}

async function generateWithGemini(promptParts: any[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
  const result = await model.generateContent(promptParts)
  const response = await result.response
  let text = response.text()
  text = stripMarkdownCodeFences(text)
  return text
}

/**
 * Local LLM fallback (text-only) using Ollama HTTP API.
 * Docs: http://127.0.0.1:11434/api/generate
 */
async function generateWithLocalLLM(args: {
  instruction: string
  extractedText: string
}) {
  const enable = process.env.ENABLE_LOCAL_FALLBACK === "true"
  if (!enable) {
    throw new Error("Local fallback disabled (ENABLE_LOCAL_FALLBACK != true)")
  }

  const url = process.env.LOCAL_LLM_URL || "http://127.0.0.1:11434"
  const model = process.env.LOCAL_LLM_MODEL || "qwen2.5:7b-instruct"

  const prompt = `
${args.instruction}

CONTENT START
${args.extractedText || "(No text could be extracted from files.)"}
CONTENT END
`.trim()

  const res = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    
      options: { temperature: 0.2 },
    }),
  })

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "")
    throw new Error(`Local LLM failed: ${res.status} ${res.statusText} ${errTxt}`)
  }

  const data = (await res.json()) as { response?: string }
  const text = stripMarkdownCodeFences(data.response || "")
  return text
}

async function extractTextForLocalFallback(uploadsDir: string, files: string[]) {
  const chunks: string[] = []

  for (const file of files) {
    const filePath = path.join(uploadsDir, file)
    const ext = path.extname(file).toLowerCase()

    // TXT/MD
    if (ext === ".txt" || ext === ".md") {
      const t = fs.readFileSync(filePath, "utf-8")
      chunks.push(`--- ${file} ---\n${t}`)
      continue
    }

    
    if (ext === ".pdf") {
      const buf = fs.readFileSync(filePath)
      try {
        const parsed = await pdfParse(buf)
        const text = (parsed.text || "").trim()
        chunks.push(`--- ${file} (PDF extracted text) ---\n${text}`)
      } catch {
        chunks.push(`--- ${file} ---\n(PDF text extraction failed)`)
      }
      continue
    }


    if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
      chunks.push(`--- ${file} ---\n(Image skipped for local fallback: no vision model)`)
      continue
    }
  }

  return chunks.join("\n\n")
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { count = 5, topic = "all", difficulty = "Medium" } = await request.json()

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ error: "Uploads directory not found" }, { status: 404 })
    }

    const files = fs.readdirSync(uploadsDir)
    const instruction = buildJsonInstruction(count, topic, difficulty)

    
    const promptParts: any[] = []
    promptParts.push(instruction)

    let fileCount = 0
    for (const file of files) {
      const filePath = path.join(uploadsDir, file)
      const mimeType = getMimeType(file)

      if (mimeType) {
        promptParts.push(fileToGenerativePart(filePath, mimeType))
        fileCount++
      } else if (file.endsWith(".txt") || file.endsWith(".md")) {
        const textContent = fs.readFileSync(filePath, "utf-8")
        promptParts.push(`\n--- Content of ${file} ---\n${textContent}\n`)
        fileCount++
      }
    }

    if (fileCount === 0) {
      return NextResponse.json(
        { error: "No compatible files (PDF/Images/Text) found in uploads folder" },
        { status: 400 }
      )
    }

    const forceLocal =
      request.headers.get("x-force-local") === "1" ||
      new URL(request.url).searchParams.get("forceLocal") === "1"

    let providerUsed: "gemini" | "local" = "gemini"
    let rawText: string

    
    try {
      if (forceLocal) throw new Error("Forced local fallback for demo")
      rawText = await generateWithGemini(promptParts)
      providerUsed = "gemini"
    } catch (geminiErr) {
      
      const extractedText = await extractTextForLocalFallback(uploadsDir, files)
      rawText = await generateWithLocalLLM({ instruction, extractedText })
      providerUsed = "local"
    }

    const generatedQuestions = JSON.parse(rawText)

    const savedQuestions = await Promise.all(
      generatedQuestions.map((q: any) =>
        prisma.practiceQuestion.create({
          data: {
            userId: token.id as string,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            topic: q.topic || topic,
            difficulty: q.difficulty || difficulty,
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: "Questions generated successfully from your files",
        providerUsed, // 👈 show this in defence
        questions: savedQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Generation Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
