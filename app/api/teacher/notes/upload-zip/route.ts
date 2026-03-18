import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import AdmZip from "adm-zip"
import { createExtractorFromData } from "node-unrar-js"
import { extractTextFromPDF, chunkText, generateEmbeddings } from "@/lib/embeddings"

interface FileEntry {
  path: string
  name: string
  content: Buffer
  isDirectory: boolean
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const studentId = formData.get("studentId") as string
    const archiveFile = formData.get("zipFile") as File | null

    if (!studentId || !archiveFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate archive file (ZIP or RAR)
    const fileName = archiveFile.name.toLowerCase()
    const isZip = fileName.endsWith(".zip")
    const isRar = fileName.endsWith(".rar")

    if (!isZip && !isRar) {
      return NextResponse.json({ error: "File must be a ZIP or RAR archive" }, { status: 400 })
    }

    // Read archive file
    const archiveBuffer = Buffer.from(await archiveFile.arrayBuffer())
    const files: FileEntry[] = []

    // Extract files based on archive type
    if (isZip) {
      // Handle ZIP files
      const zip = new AdmZip(archiveBuffer)
      const zipEntries = zip.getEntries()

      // Process all entries in the zip
      for (const entry of zipEntries) {
        // Skip directories (they end with /)
        if (entry.entryName.endsWith("/")) {
          continue
        }

        // Get file content
        const content = entry.getData()
        const entryName = entry.entryName

        files.push({
          path: entryName,
          name: entryName.split("/").pop() || entryName,
          content: content,
          isDirectory: false,
        })
      }
    } else if (isRar) {
      // Handle RAR files
      try {
        // Convert Buffer to Uint8Array for node-unrar-js
        const uint8Array = new Uint8Array(archiveBuffer)
        console.log("RAR file size:", archiveBuffer.length, "bytes")
        
        const extractor = await createExtractorFromData({ 
          data: uint8Array.buffer as ArrayBuffer
        })
        const list = extractor.getFileList()
        
        // Convert generator to array
        const fileHeaders = Array.from(list.fileHeaders)
        
        // Filter out directories and get file names
        const fileNames: string[] = []
        const validFileHeaders: typeof fileHeaders = []
        
        for (const header of fileHeaders) {
          if (!header.flags.directory) {
            fileNames.push(header.name)
            validFileHeaders.push(header)
          }
        }
        
        if (fileNames.length === 0) {
          return NextResponse.json({ error: "RAR file contains only directories or is empty" }, { status: 400 })
        }
        
        const extracted = extractor.extract({ files: fileNames })
        const extractedFiles = Array.from(extracted.files)

        // Process extracted files - match by index since they should be in the same order
        for (let i = 0; i < validFileHeaders.length; i++) {
          const fileHeader = validFileHeaders[i]
          const fileData = extractedFiles[i]
          
          if (fileData) {
            // Try different ways to access the file data
            let fileContent: Buffer
            
            try {
              // The ArcFile might be the Uint8Array directly, or have it in a property
              if (fileData instanceof Uint8Array) {
                fileContent = Buffer.from(fileData)
              } else {
                // Try to access as object with various possible properties
                const dataObj = fileData as any
                if (dataObj.extract && dataObj.extract instanceof Uint8Array) {
                  fileContent = Buffer.from(dataObj.extract)
                } else if (dataObj.buffer && dataObj.buffer instanceof Uint8Array) {
                  fileContent = Buffer.from(dataObj.buffer)
                } else if (dataObj.data && dataObj.data instanceof Uint8Array) {
                  fileContent = Buffer.from(dataObj.data)
                } else {
                  // Last resort: try to convert the whole object
                  fileContent = Buffer.from(fileData as unknown as Uint8Array)
                }
              }
              
              files.push({
                path: fileHeader.name.replace(/\\/g, "/"), // Normalize path separators
                name: fileHeader.name.split(/[/\\]/).pop() || fileHeader.name,
                content: fileContent,
                isDirectory: false,
              })
            } catch (contentError) {
              console.error(`Error processing file ${fileHeader.name}:`, contentError)
              // Skip this file and continue with others
            }
          }
        }
      } catch (error: any) {
        console.error("Error extracting RAR file:", error)
        console.error("Error stack:", error?.stack)
        const errorMessage = error?.message || String(error) || "Unknown error"
        console.error("Error name:", error?.name)
        console.error("Full error object:", error)
        
        // Provide more helpful error message
        let userMessage = "Failed to extract RAR file. "
        if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
          userMessage += "The file is password-protected. Please extract it manually and upload as ZIP."
        } else if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
          userMessage += "The file appears to be corrupted. Please verify the file integrity."
        } else {
          userMessage += `Error: ${errorMessage}. The file may be corrupted or password-protected.`
        }
        
        return NextResponse.json({ 
          error: userMessage
        }, { status: 400 })
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "Archive file is empty or contains only directories" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Determine target students
    let targetStudents: { id: string }[] = []

    if (studentId === "all") {
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

      targetStudents = allStudents
    } else {
      // Verify student exists
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true },
      })

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }

      targetStudents = [student]
    }

    // Process and store each file
    const createdNotes = []
    const timestamp = Date.now()

    for (const file of files) {
      // Generate unique filename - preserve folder structure but sanitize
      const sanitizedPath = file.path
        .split("/")
        .map((part) => part.replace(/[^a-zA-Z0-9.-]/g, "_"))
        .join("_")
      const fileName = `${timestamp}_${sanitizedPath}`
      const filePath = join(uploadsDir, fileName)

      // Save file to disk
      await writeFile(filePath, file.content)

      const fileUrl = `/uploads/${fileName}`
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "unknown"
      const fileType = getFileType(fileExtension)

      // Extract text content first (for storage and embeddings)
      let extractedText: string | null = null
      try {
        extractedText = await extractAndStoreText(file.name, null, filePath, fileExtension)
      } catch (error) {
        console.error(`Error extracting text from ${file.name}:`, error)
      }

      // Create notes for all target students
      for (const student of targetStudents) {
        // Use folder structure as title prefix
        const folderPath = file.path.split("/").slice(0, -1).join(" / ")
        const title = folderPath ? `${folderPath} / ${file.name}` : file.name

        const note = await prisma.studentNote.create({
          data: {
            studentId: student.id,
            teacherId: token.id as string,
            title,
            content: null,
            extractedText,
            fileUrl,
            fileName: file.name,
            fileType,
          },
        })

        // Generate embeddings for this note (async, don't wait)
        generateNoteEmbeddings(note.id, title, null, filePath, fileExtension, extractedText).catch((error) => {
          console.error("Error generating embeddings:", error)
        })

        createdNotes.push(note)
      }
    }

    return NextResponse.json(
      {
        message: `Successfully uploaded ${files.length} files from ${isZip ? "ZIP" : "RAR"} archive to ${targetStudents.length} student(s)`,
        filesCount: files.length,
        studentsCount: targetStudents.length,
        notesCount: createdNotes.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Upload archive error:", error)
    return NextResponse.json({ error: "Failed to process archive file" }, { status: 500 })
  }
}

// Helper function to determine file type
function getFileType(extension: string): string {
  const typeMap: { [key: string]: string } = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOCX",
    txt: "TXT",
    md: "Markdown",
    html: "HTML",
    htm: "HTML",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    zip: "ZIP",
    rar: "RAR",
    xlsx: "Excel",
    xls: "Excel",
    pptx: "PowerPoint",
    ppt: "PowerPoint",
  }

  return typeMap[extension.toLowerCase()] || extension.toUpperCase()
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
  fileExtension?: string,
  extractedText?: string | null
): Promise<void> {
  try {
    // Always generate embeddings using local model (no API key needed)

    // Use stored extractedText if available, otherwise extract from file
    let fullText: string
    if (extractedText) {
      fullText = extractedText
    } else {
      fullText = await extractAndStoreText(title, content, filePath, fileExtension)
      
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

