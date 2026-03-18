import pdfParse from "pdf-parse"
import { readFile } from "fs/promises"
import { pipeline } from "@xenova/transformers"
import { createWorker } from 'tesseract.js'
import path from 'path'

// Initialize local embedding model (lazy loading)
let embeddingPipeline: any = null

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    try {
      embeddingPipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        { quantized: true }
      )
    } catch (error: any) {
      console.error("Error loading embedding model:", error)
      throw new Error("Failed to load embedding model")
    }
  }
  return embeddingPipeline
}

function preprocessText(text: string): string {
  return text
    .replace(/[●•◦‣⁃]/g, "•") 
    .replace(/\u00A0/g, " ") 
    .replace(/\r\n/g, "\n") 
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ") 
    .replace(/\n{3,}/g, "\n\n") 
    .trim()
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const preprocessed = preprocessText(text)
  const chunks: string[] = []
  const sections = preprocessed.split(/\n{2,}/)
  
  for (const section of sections) {
    if (section.trim().length === 0) continue
    if (section.length <= chunkSize) {
      chunks.push(section.trim())
    } else {
      let start = 0
      while (start < section.length) {
        let end = start + chunkSize
        chunks.push(section.slice(start, end).trim())
        start = end - overlap
      }
    }
  }
  return chunks.filter(c => c.length > 10)
}

/**
 * WINDOWS SAFE EXTRACTION
 * Uses pdf-parse for text and tesseract.js (WASM) for OCR
 * No 'canvas' or 'pdf-img-convert' required.
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log(`Processing: ${path.basename(filePath)}`)
    const fileBuffer = await readFile(filePath)
    
    // 1. Try standard extraction
    const data = await pdfParse(fileBuffer)
    let extractedText = data.text.trim()

    // 2. OCR Fallback for fyp1 posture (Images/Posters)
    // We check if the result is basically empty
    if (!extractedText || extractedText.length < 50) {
      console.log("No text layer found. PDF is likely an image. Starting WASM OCR...")
      
      const worker = await createWorker('eng')
      
      // Tesseract.js (WASM) can often process image-PDF buffers directly 
      // without needing to manually split pages into PNGs first.
      const { data: { text } } = await worker.recognize(fileBuffer)
      
      await worker.terminate()
      extractedText = text.trim()
      console.log("OCR Extraction complete.")
    }

    return extractedText
  } catch (error: any) {
    console.error("Error in extractTextFromPDF:", error)
    return "" 
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getEmbeddingPipeline()
  const output = await extractor(text, { pooling: "mean", normalize: true })
  return Array.from(output.data as ArrayLike<number>)
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const extractor = await getEmbeddingPipeline()
  const embeddings: number[][] = []
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true })
    embeddings.push(Array.from(output.data as ArrayLike<number>))
  }
  return embeddings
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}