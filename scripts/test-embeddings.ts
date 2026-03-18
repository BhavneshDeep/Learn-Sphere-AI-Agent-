// Test script to verify embedding generation works
import { generateEmbedding, generateEmbeddings } from "../lib/embeddings"

async function testEmbeddings() {
  console.log("Testing embedding generation...")
  
  try {
    // Test single embedding
    console.log("\n1. Testing single embedding generation...")
    const testText = "This is a test sentence for embedding generation."
    const embedding = await generateEmbedding(testText)
    console.log("✓ Single embedding generated successfully")
    console.log(`  - Length: ${embedding.length}`)
    console.log(`  - First 5 values: ${embedding.slice(0, 5).join(", ")}`)
    
    // Test multiple embeddings
    console.log("\n2. Testing multiple embeddings generation...")
    const testTexts = [
      "First test sentence.",
      "Second test sentence.",
      "Third test sentence."
    ]
    const embeddings = await generateEmbeddings(testTexts)
    console.log("✓ Multiple embeddings generated successfully")
    console.log(`  - Count: ${embeddings.length}`)
    console.log(`  - Each length: ${embeddings[0]?.length}`)
    
    console.log("\n✅ All embedding tests passed!")
    process.exit(0)
  } catch (error: any) {
    console.error("\n❌ Embedding test failed:")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    process.exit(1)
  }
}

testEmbeddings()

