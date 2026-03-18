const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key directly or via process.env
// If you don't have dotenv setup for this script, just paste the key string below for testing
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyB5pMnc53IKS7qNJHlEW0aJSnDS9_DnGzw";

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking available models...");
    
    // There isn't a direct "listModels" in the simple client, 
    // but we can test if the standard name works:
    try {
        const result = await model.generateContent("Hello");
        console.log("✅ SUCCESS! 'gemini-1.5-flash' is working.");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("❌ 'gemini-1.5-flash' failed.");
        console.error(e.message);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();