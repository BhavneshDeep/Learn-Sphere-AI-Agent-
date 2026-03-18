import { NextResponse } from "next/server"
import { add, deleteAll, deleteMany, getAll, type ChatMode } from "@/lib/chatStore"

import { prisma } from "@/lib/db"
import { searchRelevantNotes } from "@/lib/vector-search"
import { extractTextFromPDF } from "@/lib/embeddings"
import { readFile } from "fs/promises"
import { join } from "path"

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434"
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:0.5b"
// const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b"

const MAX_CONTEXT_TURNS = 8
const TOP_K_NOTES = 5
const SIMILARITY_THRESHOLD = 0.05


async function extractNoteContent(note: any): Promise<string> {
  if (note.extractedText && note.extractedText.trim().length > 0) {
    return note.extractedText.trim()
  }

  let fullContent = note.title
  if (note.content && note.content.trim().length > 0) {
    fullContent += `\n\n${note.content}`
  }

  if ((!note.content || note.content.trim().length < 50) && note.fileUrl && note.fileName) {
    try {
      const filePath = join(process.cwd(), "public", note.fileUrl.replace(/^\//, ""))
      const fileExtension = note.fileName.split(".").pop()?.toLowerCase() || ""

      if (fileExtension === "pdf" || note.fileType === "PDF") {
        const pdfText = await extractTextFromPDF(filePath)
        if (pdfText) fullContent += `\n\n${pdfText}`
      } else if (["txt", "md"].includes(fileExtension)) {
        const textContent = await readFile(filePath, "utf-8")
        if (textContent) fullContent += `\n\n${textContent}`
      }
    } catch (e) {
      console.error("File read error", e)
    }
  }

  return fullContent.trim()
}


function systemPromptForModeStrict(mode: ChatMode) {
  let modeInstruction = "";

  if (mode === "HINT_ONLY") {
    modeInstruction = `
    MODE: HINT ONLY
    - NEVER give the full answer.
    - Only provide a small clue or point the student toward the right concept in the CONTEXT.
    - Example: Instead of "The answer is 5", say "Look at the section about addition in your notes."`;
  } else if (mode === "SHORT") {
    modeInstruction = `
    MODE: SHORT ANSWER
    - Your response MUST be between 1 to 3 sentences.
    - Be direct and concise. Do not add introductory fluff.`;
  } else {
    modeInstruction = `
    MODE: DETAILED ANSWER
    - Provide a step-by-step explanation.
    - Break down complex concepts into smaller parts.
    - Use bullet points if necessary for clarity.`;
  }

  return `
You are LearnSphere Tutor, a professional academic assistant.
You must help students strictly based on the provided CONTEXT.

CORE RULES:
1. Answer ONLY using the given CONTEXT. No general knowledge.
2. If the answer is not in CONTEXT, reply ONLY: NOT_IN_CONTEXT
3. ${modeInstruction}

Follow all rules strictly.
`.trim();
}




function buildMessagesWithContext(params: {
  question: string
  mode: ChatMode
  context: string
}) {
  const { question, mode, context } = params
  console.log("Building messages with context. Mode:", context)
  const history = getAll().slice(-MAX_CONTEXT_TURNS)

  return [
    { role: "system", content: systemPromptForModeStrict(mode) },
    {
      role: "user",
      content: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`,
    },
  ]
}

function isLikelyGrounded(answer: string, context: string) {
  const a = answer.toLowerCase()
  const c = context.toLowerCase()
 
  const words = a.split(/\W+/).filter((w) => w.length >= 3) 
  let hits = 0
  for (const w of words) {
    if (c.includes(w)) hits++
 
    if (hits >= 2) return true 
  }
  return false
}


export async function GET() {
  return NextResponse.json(getAll())
}


export async function POST(req: Request) {
  try {
    const { question, mode, userId } = (await req.json()) as {
      question: string
      mode: ChatMode
      userId: string 
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required for context retrieval in local-chat route" },
        { status: 400 }
      )
    }
    // ✅ retrieve relevant notes (RAG)
    const relevantNotes = await searchRelevantNotes(question, userId, TOP_K_NOTES)
    console.log("Relevant notes found:", relevantNotes.length, "ques:",question)

    const sourceNotes: any[] = []
    const contextParts = await Promise.all(
      relevantNotes
        .slice(0, TOP_K_NOTES) 
        .map(async (note: any) => {
          const fullNote = await prisma.studentNote.findUnique({
            where: { id: note.noteId },
          })
          if (!fullNote) return ""

          if (!sourceNotes.find((s) => s.id === fullNote.id)) {
            sourceNotes.push({ id: fullNote.id, title: fullNote.title, fileUrl: fullNote.fileUrl })
          }

          return await extractNoteContent(fullNote)
        })
    )

    const rawContext = contextParts.join("\n\n").trim();
    console.log("Raw context length:", relevantNotes)
    // const fallbackMessage =
    //   "This question isn't related to your notes/course context. Please ask something from the curriculum!"

    // // If no context found -> fallback immediately (no model call)
    // if (!rawContext) {
    //   const saved = add({
    //     id: crypto.randomUUID(),
    //     question,
    //     answer: fallbackMessage,
    //     mode: mode ?? "SHORT",
    //     timestamp: new Date().toISOString(),
    //   })
    //   return NextResponse.json({ ...saved, sourceNotes: [] })
    // }

    const messages = buildMessagesWithContext({
      question,
      mode: mode ?? "SHORT",
      context: rawContext,
    })

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: mode === "SHORT" ? 180 : mode === "HINT_ONLY" ? 90 : 450,
        },
      }),
    })

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text()
      return NextResponse.json({ error: "Ollama error", details: text }, { status: 500 })
    }

    const data = await ollamaRes.json()
    let answer = (data?.message?.content ?? "").trim()

    if (answer === "NOT_IN_CONTEXT" || !isLikelyGrounded(answer, rawContext)) {
    //   answer = fallbackMessage
    } else {
      if (sourceNotes.length > 0) {
        const names = sourceNotes.map((n) => n.title).join(", ")
        answer += `\n\nSource: ${names}`
      }
    }

    const saved = add({
      id: crypto.randomUUID(),
      question,
      answer,
      mode: mode ?? "SHORT",
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ ...saved, sourceNotes })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  if (action === "all") {
    deleteAll()
    return NextResponse.json({ ok: true })
  }

  if (action === "selected") {
    const body = await req.json().catch(() => null)
    const ids: string[] = body?.ids ?? []
    deleteMany(ids)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
