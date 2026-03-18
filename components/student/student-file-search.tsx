"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Download, Loader2, BookOpen, Calendar, LayoutGrid, List } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Note {
  id: string
  title: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileType: string | null
  createdAt: string
}

export function StudentSearchFile() {
  const [query, setQuery] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("list")

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotes(query)
    }, 400) // Search after user stops typing for 400ms

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const fetchNotes = async (searchQuery = "") => {
    setLoading(true)
    try {
      const url = searchQuery 
        ? `/api/student/notes?query=${encodeURIComponent(searchQuery)}` 
        : "/api/student/notes"
        
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string | null, size = "w-6 h-6") => {
    if (!fileType) return <BookOpen className={`${size} text-blue-500`} />
    if (fileType.toLowerCase().includes("pdf")) return <FileText className={`${size} text-red-500`} />
    return <FileText className={`${size} text-gray-500`} />
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          placeholder="Deep search topics inside notes..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-lg py-6 pl-12"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {loading ? "Searching..." : `Results (${notes.length})`}
          </h2>
          
          <div className="flex bg-muted p-1 rounded-lg border">
            <Button 
              variant={view === "list" ? "default" : "ghost"} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setView("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant={view === "grid" ? "default" : "ghost"} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-muted/30 rounded-lg p-12 text-center border border-dashed">
            <p className="text-muted-foreground">
              {query ? "No matches found inside your notes." : "No study notes available yet."}
            </p>
          </div>
        ) : (
          <div className={view === "list" ? "bg-white rounded-md border shadow-sm divide-y" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
            {notes.map((note) => (
              view === "list" ? (
                <div key={note.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1 bg-slate-100 p-2 rounded-lg shrink-0">
                      {getFileIcon(note.fileType)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate pr-2">{note.title}</h3>
                        {note.fileType && (
                          <Badge variant="secondary" className="uppercase text-[10px] h-5 px-1.5">
                            {note.fileType.replace('.', '')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{note.content || "Deep search match found."}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {note.fileUrl && (
                       <Button asChild size="sm" variant="outline" className="w-full sm:w-auto gap-2">
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" /> Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Card key={note.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex gap-3 overflow-hidden">
                      <div className="mt-1 bg-slate-100 p-2 rounded-lg shrink-0">
                        {getFileIcon(note.fileType, "w-6 h-6")}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{note.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          <Calendar className="inline w-3 h-3 mr-1" />
                          {new Date(note.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {note.content || "Content match found in deep search."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t">
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {note.fileType?.replace('.', '') || 'Text'}
                      </Badge>
                      {note.fileUrl && (
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                          <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" /> Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}