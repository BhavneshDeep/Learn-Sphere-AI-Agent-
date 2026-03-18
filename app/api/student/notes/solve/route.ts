import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const problemText = formData.get("problem") as string
    const imageFile = formData.get("image") as File | null

    if (!problemText && !imageFile) {
      return NextResponse.json({ error: "Please provide text or an image." }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const promptParts: any[] = []

    if (problemText) {
      promptParts.push(`Please solve this problem step-by-step and provide the final answer clearly. Subject context: Physics/Math/General. Problem: ${problemText}`)
    } else {
      promptParts.push("Please analyze this image, identify the problem inside it, and solve it step-by-step.")
    }

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      promptParts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: imageFile.type,
        },
      })
    }

    const result = await model.generateContent(promptParts)
    const response = await result.response
    const solution = response.text()

    return NextResponse.json({ solution })

  } catch (error) {
    console.error("Gemini Error:", error)
    return NextResponse.json({ error: "Failed to solve problem" }, { status: 500 })
  }
}