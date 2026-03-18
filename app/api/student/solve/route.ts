// app/api/solve/route.ts  (or whatever route you use)
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function stripMarkdownCodeFences(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim()
}

async function generateWithGemini(promptParts: any[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
  const result = await model.generateContent(promptParts)
  const response = await result.response
  return stripMarkdownCodeFences(response.text())
}

/**
 * Local LLM fallback (text-only) using Ollama HTTP API.
 * Endpoint: http://127.0.0.1:11434/api/generate
 */
async function generateWithLocalLLM(args: {
  systemPrompt: string
  problemText?: string
  extractedText?: string
}) {
  const enable = process.env.ENABLE_LOCAL_FALLBACK === "true"
  if (!enable) {
    throw new Error("Local fallback disabled (ENABLE_LOCAL_FALLBACK != true)")
  }

  const url = process.env.LOCAL_LLM_URL || "http://127.0.0.1:11434"
  const model = process.env.LOCAL_LLM_MODEL || "qwen2.5:7b-instruct"

  const prompt = `
${args.systemPrompt}

PROBLEM:
${(args.problemText || "").trim() || "(No direct text provided.)"}

ATTACHED FILE (EXTRACTED TEXT):
${(args.extractedText || "").trim() || "(No text could be extracted from the file.)"}

INSTRUCTIONS:
- Solve step-by-step.
- Provide the final answer clearly at the end.
- If information is missing, state what is missing.
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
  return stripMarkdownCodeFences(data.response || "")
}

async function extractTextForLocalFallback(uploadedFile: File | null) {
  if (!uploadedFile) return ""

  // PDF text extraction for local fallback
  if (uploadedFile.type === "application/pdf") {
    try {
      const ab = await uploadedFile.arrayBuffer()
      const buf = Buffer.from(ab)
      const parsed = await pdfParse(buf)
      return (parsed.text || "").trim()
    } catch {
      return "(PDF text extraction failed)"
    }
  }

  // Images: local fallback has no vision
  if (uploadedFile.type === "image/png" || uploadedFile.type === "image/jpeg") {
    return "(Image skipped for local fallback: no vision model)"
  }

  return "(Unsupported file type for local fallback extraction)"
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const problemText = (formData.get("problem") as string) || ""
    const uploadedFile = (formData.get("file") || formData.get("image")) as File | null

    if (!problemText && !uploadedFile) {
      return NextResponse.json({ error: "Please provide text or a file." }, { status: 400 })
    }

    // System prompt
    const systemPrompt = `You are an expert tutor. Solve the problem provided in the text or document step-by-step.
Subject context: Physics/Math/General.`

    // Gemini prompt parts (multimodal)
    const promptParts: any[] = []

    if (problemText) {
      promptParts.push(`${systemPrompt}\nProblem: ${problemText}`)
    } else {
      promptParts.push(`${systemPrompt}\nPlease analyze the attached file, identify the problem, and solve it.`)
    }

    if (uploadedFile) {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      promptParts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: uploadedFile.type, // application/pdf or image/*
        },
      })
    }

    // Force local fallback (optional)
    const forceLocal =
      req.headers.get("x-force-local") === "1" ||
      new URL(req.url).searchParams.get("forceLocal") === "1"

    let providerUsed: "gemini" | "local" = "gemini"
    let solution = ""

    try {
      if (forceLocal) throw new Error("Forced local fallback for demo")
      solution = await generateWithGemini(promptParts)
      providerUsed = "gemini"
    } catch (geminiErr: any) {
      const extractedText = await extractTextForLocalFallback(uploadedFile)
      solution = await generateWithLocalLLM({
        systemPrompt,
        problemText,
        extractedText,
      })
      providerUsed = "local"
    }

    return NextResponse.json({ solution, providerUsed }, { status: 200 })
  } catch (error: any) {
    console.error("Solver Error:", error)
    return NextResponse.json(
      { error: "Failed to solve problem", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
