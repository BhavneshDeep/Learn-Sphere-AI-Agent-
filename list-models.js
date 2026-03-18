// list-models.js
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyB5pMnc53IKS7qNJHlEW0aJSnDS9_DnGzw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching available models...");

fetch(url)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
        console.error("Error:", data.error.message);
    } else {
        console.log("\n✅ AVAILABLE MODELS:");
        // Filter for models that support 'generateContent'
        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));
            
        console.log(models.join("\n"));
    }
  })
  .catch((err) => console.error("Network Error:", err));