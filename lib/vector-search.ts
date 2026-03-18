import { prisma } from "@/lib/db"
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings"

interface SearchResult {
  content: string
  noteId: string
  title: string
  similarity: number
}

// Search for relevant note content using vector similarity
export async function searchRelevantNotes(
  query: string,
  studentId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Get all notes accessible to the student
    const notes = await prisma.studentNote.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        embeddings: true,
      },
    })

    console.log(`Found ${notes.length} notes for student ${studentId}`)
    console.log(`Total embeddings: ${notes.reduce((sum, note) => sum + note.embeddings.length, 0)}`)

    // If no notes found, return empty
    if (notes.length === 0) {
      console.log("No notes found for student")
      return []
    }

    // If embeddings exist, use vector search
    const totalEmbeddings = notes.reduce((sum, note) => sum + note.embeddings.length, 0)
    
    if (totalEmbeddings > 0) {
      try {
        // Generate embedding for the query using local model
        let queryEmbedding: number[]
        try {
          queryEmbedding = await generateEmbedding(query)
        } catch (embedError: any) {
          console.error("Error generating query embedding:", embedError)
          // Fall through to text-based search if embedding fails
          throw embedError
        }

        // Calculate similarity for each embedding chunk
        const results: SearchResult[] = []

        for (const note of notes) {
          for (const embedding of note.embeddings) {
            // Handle both JSON and array formats
            let embeddingVector: number[] = []
            if (Array.isArray(embedding.embedding)) {
              embeddingVector = embedding.embedding as number[]
            } else if (typeof embedding.embedding === 'object' && embedding.embedding !== null) {
              // If it's stored as JSON object, try to extract array
              embeddingVector = Object.values(embedding.embedding) as number[]
            }
            
            if (Array.isArray(embeddingVector) && embeddingVector.length > 0) {
              const similarity = cosineSimilarity(queryEmbedding, embeddingVector)

              results.push({
                content: embedding.content,
                noteId: note.id,
                title: note.title,
                similarity,
              })
            }
          }
        }

        // Sort by similarity (highest first) and return top results
        results.sort((a, b) => b.similarity - a.similarity)

        // Lower threshold to 0.15 for better recall, or take top results even if below threshold
        // This ensures we always return something if there are any embeddings
        let filteredResults = results.filter((r) => r.similarity > 0.05)
        if (filteredResults.length === 0 && results.length > 0) {
          // Always return at least the top 2-3 matches even if similarity is low
          filteredResults = results.slice(0, Math.min(3, results.length))
        } else {
          filteredResults = filteredResults.slice(0, limit)
        }

        console.log(`Vector search found ${filteredResults.length} results`)
        if (filteredResults.length > 0) {
          console.log(`Top similarity: ${filteredResults[0].similarity.toFixed(3)}`)
        }

        return filteredResults
      } catch (embeddingError) {
        console.error("Error in vector search, falling back to text search:", embeddingError)
        // Fall through to text-based search
      }
    }

    // Fallback: Use text-based search if embeddings don't exist or vector search fails
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2) // Filter out short words
    const results: SearchResult[] = []

    for (const note of notes) {
      let score = 0
      let bestContent = ""
      
      // Check title match
      const titleLower = note.title.toLowerCase()
      if (titleLower.includes(queryLower)) {
        score += 0.3
      }
      // Check word matches in title
      const titleWordMatches = queryWords.filter(word => titleLower.includes(word)).length
      score += (titleWordMatches / queryWords.length) * 0.2
      
      // Check content match
      if (note.content) {
        const contentLower = note.content.toLowerCase()
        if (contentLower.includes(queryLower)) {
          score += 0.4
          bestContent = note.content
        } else {
          // Check word matches in content
          const contentWordMatches = queryWords.filter(word => contentLower.includes(word)).length
          score += (contentWordMatches / queryWords.length) * 0.3
          if (contentWordMatches > 0) {
            bestContent = note.content
          }
        }
      }
      
      // Check embeddings content if available
      for (const embedding of note.embeddings) {
        const embeddingLower = embedding.content.toLowerCase()
        if (embeddingLower.includes(queryLower)) {
          score += 0.5
          bestContent = embedding.content
          break
        } else {
          const embeddingWordMatches = queryWords.filter(word => embeddingLower.includes(word)).length
          if (embeddingWordMatches > 0) {
            score += (embeddingWordMatches / queryWords.length) * 0.4
            if (!bestContent || embeddingWordMatches > queryWords.length * 0.5) {
              bestContent = embedding.content
            }
          }
        }
      }

      // If we found a match (score > 0), add it to results
      if (score > 0) {
        const content = bestContent || note.content || note.title
        results.push({
          content: content,
          noteId: note.id,
          title: note.title,
          similarity: Math.min(score, 1.0), // Cap at 1.0
        })
      }
    }

    console.log(`Text search found ${results.length} results`)
    return results.slice(0, limit)
  } catch (error) {
    console.error("Error searching notes:", error)
    return []
  }
}

// Get all note content for a student (for context)
export async function getAllNoteContent(studentId: string): Promise<string> {
  try {
    const notes = await prisma.studentNote.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        title: true,
        content: true,
      },
    })

    return notes
      .map((note) => `Title: ${note.title}\nContent: ${note.content || ""}`)
      .join("\n\n---\n\n")
  } catch (error) {
    console.error("Error getting note content:", error)
    return ""
  }
}

