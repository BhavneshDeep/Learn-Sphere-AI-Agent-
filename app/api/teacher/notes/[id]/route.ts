import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { unlink, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { extractTextFromPDF, chunkText, generateEmbeddings } from "@/lib/embeddings"
import { readFile } from "fs/promises"

// Helper function to extract and store text content from files
async function extractAndStoreText(
  title: string,
  content: string | null,
  filePath: string | null,
  fileExtension?: string
): Promise<string> {
  let fullText = `Title: ${title}\n\n`

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
    }
  }

  return fullText
}

// Helper function to regenerate embeddings for a note
async function regenerateNoteEmbeddings(
  noteId: string,
  title: string,
  content: string | null,
  filePath: string | null,
  fileExtension?: string
): Promise<void> {
  try {
    // Extract text from file
    const fullText = await extractAndStoreText(title, content, filePath, fileExtension)

    // Update the note with extracted text
    await prisma.studentNote.update({
      where: { id: noteId },
      data: { extractedText: fullText },
    })

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200)

    if (chunks.length === 0) {
      console.log(`No chunks generated for note ${noteId} - text might be empty`)
      return
    }

    // Delete existing embeddings
    await prisma.noteEmbedding.deleteMany({
      where: { noteId },
    })

    console.log(`Generating ${chunks.length} embeddings for note ${noteId}`)

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks)

    // Store embeddings in database
    await prisma.noteEmbedding.createMany({
      data: chunks.map((chunk, index) => ({
        noteId,
        content: chunk,
        embedding: embeddings[index],
        chunkIndex: index,
      })),
    })

    console.log(`Successfully regenerated embeddings for note ${noteId}`)
  } catch (error) {
    console.error("Error regenerating note embeddings:", error)
    throw error
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const note = await prisma.studentNote.findUnique({
      where: { id: params.id },
    })

    if (!note || note.teacherId !== token.id) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string | null
    const content = formData.get("content") as string | null
    const file = formData.get("file") as File | null

    let updateData: any = {}
    let filePath: string | null = null
    let fileExtension: string | null = null

    if (title) updateData.title = title
    if (content !== null) updateData.content = content

    // Handle file update
    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadsDir = join(process.cwd(), "public", "uploads")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }

      // Delete old file if exists
      if (note.fileUrl) {
        try {
          const oldFilePath = join(process.cwd(), "public", note.fileUrl.replace(/^\//, ""))
          await unlink(oldFilePath)
        } catch (error) {
          console.error("Error deleting old file:", error)
        }
      }

      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = `${timestamp}_${originalName}`
      filePath = join(uploadsDir, fileName)

      await writeFile(filePath, buffer)

      updateData.fileUrl = `/uploads/${fileName}`
      updateData.fileName = file.name
      updateData.fileType = file.type || file.name.split(".").pop() || "unknown"
      fileExtension = file.name.split(".").pop()?.toLowerCase() || null
    }

    // Update the note
    const updatedNote = await prisma.studentNote.update({
      where: { id: params.id },
      data: updateData,
    })

    // Regenerate embeddings if content or file changed
    if (content !== null || file || title) {
      regenerateNoteEmbeddings(
        note.id,
        updatedNote.title,
        updatedNote.content,
        filePath || (updatedNote.fileUrl ? join(process.cwd(), "public", updatedNote.fileUrl.replace(/^\//, "")) : null),
        fileExtension || undefined
      ).catch((error) => {
        console.error("Error regenerating embeddings:", error)
      })
    }

    return NextResponse.json({ note: updatedNote }, { status: 200 })
  } catch (error) {
    console.error("Update note error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const note = await prisma.studentNote.findUnique({
      where: { id: params.id },
    })

    if (!note || note.teacherId !== token.id) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 })
    }

    // Delete file if exists
    if (note.fileUrl && note.fileName) {
      try {
        const filePath = join(process.cwd(), "public", note.fileUrl.replace(/^\//, ""))
        await unlink(filePath)
      } catch (error) {
        console.error("Error deleting file:", error)
        // Continue even if file deletion fails
      }
    }

    await prisma.studentNote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}






