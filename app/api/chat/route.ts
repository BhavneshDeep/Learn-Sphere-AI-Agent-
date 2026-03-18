import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { searchRelevantNotes } from "@/lib/vector-search"
import { extractTextFromPDF } from "@/lib/embeddings"
import { readFile } from "fs/promises"
import { join } from "path"

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

    } catch (e) { console.error("File read error", e) }
  }

  return fullContent.trim()
}

// --- HELPER: CLEAN ANSWER GENERATION --- HINT ONLY, SHORT, DETAILED
// --- HELPER: CLEAN ANSWER GENERATION ---
function generateAnswerFromContext(context: string, question: string, mode: string): string {
  const query = question.toLowerCase().trim();

  // 1. Handle Greetings
  const greetings = ["hello", "hi", "hey", "asalam o alaikum", "greetings", "aoa", "hello tutor"];
  if (greetings.includes(query)) {
    return "Hey! I'm your LearnSphere tutor. How may I help you with your course today?";
  }

  // 2. NEW: Check for Gibberish or Symbols (e.g., ".", ",,,,", "asdfgh")
  // Ye regex check karta hai ki kya query mein koi valid word (at least 2 letters) hai ya nahi
  const hasLetters = /[a-zA-Z]/.test(query);
  
  // 2. Check for Vowels (Real words usually have vowels)
  const hasVowels = /[aeiouy]/.test(query);
  
  // 3. Check for suspiciously long strings without vowels (like "fhdahfia")
  // Or very short random inputs
  const isTooRandom = query.length > 4 && !hasVowels;

  if (!hasLetters || query.length < 2 || isTooRandom || (query.length > 10 && !query.includes(' '))) {
    return "Please ask a question in correct words so I can understand and help you better!";
  }

  const fallbackMessage = "This question isn't related to our course. Please ask something about the curriculum!";
  if (!context || context.trim().length === 0) return fallbackMessage;

  const cleanContext = context
    .replace(/\[Source \d+\]/gi, "")
    .replace(/Relevance: \d+\.?\d*%/gi, "")
    .replace(/Title:.*|Content:.*|PDF Content:.*/gi, "")
    .trim();

  const stopWords = new Set(['the', 'is', 'a', 'what', 'how', 'of', 'and', 'to']);
  const keywords = query.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  
  // 3. Check if we have any useful keywords after filtering
  if (keywords.length === 0 && query.length > 0) {
     return "Could you please be more specific about what you want to learn?";
  }

  const sentences = cleanContext
    .split(/[.!?\n]+/) 
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const scored = sentences.map(s => {
    let score = 0;
    keywords.forEach(kw => { if (s.toLowerCase().includes(kw)) score += 2 });
    if (s.toLowerCase().includes(query)) score += 5;
    if (s.length < 40) score -= 3; 
    return { s, score };
  }).sort((a, b) => b.score - a.score);

  const count = mode === "SHORT" ? 2 : mode === "HINT_ONLY" ? 1 : 6;
  const results = scored.filter(x => x.score > 0).slice(0, count).map(x => x.s);

  if (results.length === 0) return fallbackMessage;

  if (mode === "HINT_ONLY") {
    return ` ${keywords.join(", ")}. It relates to: ${results[0]}...`;
  }

  return results.join(". ") + ".";
}
// --- MAIN POST HANDLER ---
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { question, mode } = await request.json()
    const relevantNotes = await searchRelevantNotes(question, token.id as string, 5)
    
    const sourceNotes: any[] = []
    const contextParts = await Promise.all(
      relevantNotes.filter(n => n.similarity > 0.25).map(async (note) => {

        const fullNote = await prisma.studentNote.findUnique({ where: { id: note.noteId } })

        if (fullNote) {
          if (!sourceNotes.find(s => s.id === fullNote.id)) {
            sourceNotes.push({ id: fullNote.id, title: fullNote.title, fileUrl: fullNote.fileUrl })
          }
          return await extractNoteContent(fullNote)
        }

        return ""

      })
    )

    const rawContext = contextParts.join("\n\n")
    let answer = generateAnswerFromContext(rawContext, question, mode)
    
    if (sourceNotes.length > 0) {
      const names = sourceNotes.map(n => n.title).join(", ")
      answer += `\n\nSource: ${names}`
    }

    const chatHistory = await prisma.chatHistory.create({
      data: { userId: token.id as string, question, mode: mode as any, answer }
    })

    return NextResponse.json({ ...chatHistory, sourceNotes })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chats = await prisma.chatHistory.findMany({
      where: { userId: token.id as string },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(chats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "selected") {
      const { ids } = await request.json()

      await prisma.chatHistory.deleteMany({
        where: {
          id: { in: ids },
          userId: token.id as string,
        },
      })

      return NextResponse.json({ success: true })
    }

    if (action === "all") {
      await prisma.chatHistory.deleteMany({
        where: { userId: token.id as string },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
