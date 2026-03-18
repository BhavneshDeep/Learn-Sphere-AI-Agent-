"use client"

import { useState, useRef } from "react"
import { StudentNavigation } from "@/components/student/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Brain, Upload, Loader2, Download, X, FileText } from "lucide-react"
import Image from "next/image"

export default function QuickSolvePage() {
  const [problem, setProblem] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [solution, setSolution] = useState("")
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  // Ref for file input to reset it easily
 const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Only generate image previews for actual images
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile))
      } else {
        setPreview(null) // No preview for PDFs
      }
    }
  }

 const removeFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem && !file) return

    setLoading(true)
    setSolution("")

    try {
      const formData = new FormData()
      if (problem) formData.append("problem", problem)
      if (file) formData.append("file", file) // Changed key to 'file' to be generic

      const res = await fetch("/api/student/solve", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setSolution(data.solution)
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch (error) {
      console.error(error)
      alert("Failed to connect to the solver.")
    } finally {
      setLoading(false)
    }
  }
  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([solution], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "LearnSphere_Solution.txt"
    document.body.appendChild(element)
    element.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section ... */}
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Your Problem</CardTitle>
              <CardDescription>Enter text, upload an image, or a PDF file.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSolve} className="space-y-4">
                <Textarea 
                  placeholder="Type your problem here..." 
                  className="min-h-[150px] text-lg resize-y"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />

                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" // Added PDF support
                    className="hidden" 
                    id="file-upload"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  {!file ? (
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload Image or PDF</span>
                    </label>
                  ) : (
                    <div className="relative w-full h-48 flex items-center justify-center bg-slate-100 rounded-md">
                      {file.type === "application/pdf" ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-16 h-16 text-primary" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                        </div>
                      ) : (
                        preview && <Image src={preview} alt="Preview" fill className="object-contain rounded-md" />
                      )}
                      <button 
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || (!problem && !file)}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Solving...</> : <><Brain className="w-4 h-4 mr-2" /> Solve Now</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* RIGHT: Solution Section */}
          <Card className="min-h-[500px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Learnsphere Solution</CardTitle>
                <CardDescription>Step-by-step explanation</CardDescription>
              </div>
              {solution && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 bg-slate-50 mx-6 mb-6 rounded-md p-6 overflow-y-auto max-h-[600px] border">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="animate-pulse">Analyzing your problem...</p>
                </div>
              ) : solution ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-medium">
                  {solution}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                  <Brain className="w-16 h-16 mb-4" />
                  <p>Solution will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}