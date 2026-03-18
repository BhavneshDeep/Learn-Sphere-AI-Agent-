import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { extractTextFromPDF, chunkText, generateEmbeddings } from "@/lib/embeddings"
import { join } from "path"
import { readFile } from "fs/promises"


export async function POST(request: NextRequest) {
  const traceId = `regen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const log = (message: string, data?: any) => {
    console.log(`[${traceId}] REGEN_EMBEDDINGS: ${message}`, data ? JSON.stringify(data, null, 2) : "")
  }
  const logError = (message: string, error?: any) => {
    console.error(`[${traceId}] REGEN_EMBEDDINGS_ERROR: ${message}`, error)
  }

  try {
    log("=== REGENERATE EMBEDDINGS START ===")
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      logError("Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    log("Teacher authenticated", { teacherId: token.id })

    
    log("Fetching notes from database...")
    const notes = await prisma.studentNote.findMany({
      where: {
        teacherId: token.id as string,
      },
      select: {
        id: true,
        title: true,
        content: true,
        extractedText: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
      },
    })

    log("Notes fetched", { count: notes.length })

    let processed = 0
    let errors = 0
    const errorDetails: Array<{ noteId: string; title: string; error: string }> = []

    for (const note of notes) {
      try {
        log(`Processing note: ${note.title}`, { noteId: note.id })
        
      
        const deletedCount = await prisma.noteEmbedding.deleteMany({
          where: { noteId: note.id },
        })
        log(`Deleted ${deletedCount.count} existing embeddings for note ${note.id}`)

        
        let fullText: string
        
        if (note.extractedText) {
        
          fullText = note.extractedText
          log(`Using stored extracted text for note ${note.id}`, { textLength: fullText.length })
        } else {
          
          fullText = `Title: ${note.title}\n\n`

          if (note.content) {
            fullText += `Content: ${note.content}\n\n`
            log(`Added content to note ${note.id}`, { contentLength: note.content.length })
          }

          
          if (note.fileUrl && note.fileName) {
            try {
              const filePath = join(process.cwd(), "public", note.fileUrl.replace(/^\//, ""))
              const fileExtension = note.fileName.split(".").pop()?.toLowerCase() || ""
              
              log(`Extracting text from file`, { 
                filePath, 
                fileType: note.fileType,
                fileExtension 
              })
              
              if (fileExtension === "pdf" || note.fileType === "PDF") {
                const pdfText = await extractTextFromPDF(filePath)
                fullText += `PDF Content: ${pdfText}`
                log(`Extracted PDF text`, { textLength: pdfText.length })
              } else if (["txt", "md", "html", "htm"].includes(fileExtension)) {
                
                const textContent = await readFile(filePath, "utf-8")
                fullText += `File Content: ${textContent}`
                log(`Read text file`, { textLength: textContent.length })
              } else {
                log(`Skipping file extraction for unsupported type`, { fileExtension })
              }
            } catch (fileError: any) {
              logError(`Error extracting file text for note ${note.id}`, {
                error: fileError.message,
                filePath: note.fileUrl
              })
              
            }
          }

          
          await prisma.studentNote.update({
            where: { id: note.id },
            data: { extractedText: fullText },
          })

          log(`Full text prepared and stored for note ${note.id}`, { fullTextLength: fullText.length })
        }

        
        const chunks = chunkText(fullText, 1000, 200)
        log(`Text chunked`, { chunksCount: chunks.length })
        
        if (chunks.length === 0) {
          logError(`No chunks generated for note ${note.id} - text might be empty`, {
            fullTextLength: fullText.length,
            hasContent: !!note.content,
            hasFile: !!note.fileUrl
          })
          errors++
          errorDetails.push({
            noteId: note.id,
            title: note.title,
            error: "No text content found to generate embeddings"
          })
          continue
        }

        log(`Generating ${chunks.length} embeddings for note ${note.id}...`)
        let embeddings: number[][]
        try {
          embeddings = await generateEmbeddings(chunks)
          log(`Generated ${embeddings.length} embeddings successfully`)
        } catch (embedError: any) {
          logError(`Error generating embeddings for note ${note.id}`, {
            error: embedError.message,
            stack: embedError.stack
          })
          throw embedError
        }
        
        log(`Storing ${embeddings.length} embeddings in database...`)
        try {
          
          await prisma.noteEmbedding.createMany({
            data: chunks.map((chunk, index) => ({
              noteId: note.id,
              content: chunk,
              embedding: embeddings[index],
              chunkIndex: index,
            })),
          })
          log(`Successfully stored ${embeddings.length} embeddings for note ${note.id}`)
        } catch (dbError: any) {
          logError(`Error storing embeddings for note ${note.id}`, {
            error: dbError.message,
            code: dbError.code
          })
          throw dbError
        }
        
        log(`Successfully stored embeddings for note ${note.id}`, {
          embeddingsCount: embeddings.length
        })
        processed++
      } catch (error: any) {
        errors++
        logError(`Error processing note ${note.id}`, {
          title: note.title,
          error: error.message,
          code: error.code,
          type: error.type
        })
        errorDetails.push({
          noteId: note.id,
          title: note.title,
          error: error.message || "Unknown error"
        })
      }
    }

    log("=== REGENERATE EMBEDDINGS COMPLETE ===", {
      processed,
      errors,
      total: notes.length
    })

    return NextResponse.json(
      {
        message: `Processed ${processed} notes, ${errors} errors`,
        processed,
        errors,
        total: notes.length,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      },
      { status: 200 }
    )
  } catch (error: any) {
    logError("Error regenerating embeddings", {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: "Failed to regenerate embeddings",
      details: error.message
    }, { status: 500 })
  }
}




