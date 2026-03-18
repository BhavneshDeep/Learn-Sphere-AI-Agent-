"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Loader2, Trash2, X, CheckSquare, Square } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  question: string
  answer: string
  mode: string
  timestamp: string
  isUser?: boolean
}

export function ChatInterfaceNew({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [mode, setMode] = useState("SHORT")
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAction, setDeleteAction] = useState<"single" | "multiple" | "all" | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchChatHistory()
  }, [])

  // Optimized Scroll Logic: Ensures internal scrolling only
  useEffect(() => {
    if (messages.length > 0) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      }
      // Small timeout allows DOM to finish rendering message bubbles
      const timer = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timer)
    }
  }, [messages])

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/local-chat")
      const data = await response.json()
      setMessages(data.reverse())
    } catch (error) {
      console.error("Failed to fetch chat history:", error)
      toast({ title: "Error", description: "Failed to load chat history", variant: "destructive" })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    const userQuestion = input
    setInput("")

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      question: userQuestion,
      answer: "",
      mode,
      timestamp: new Date().toISOString(),
      isUser: true,
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch("/api/local-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion, mode, userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id)
          return [...filtered, data]
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- DELETE HANDLERS ---
  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false)
    if (deleteAction === "all") await handleClearAll()
    else if (deleteAction === "single" && deleteTargetId) await handleDeleteChat(deleteTargetId)
    else if (deleteAction === "multiple") await handleDeleteSelected()
    setDeleteAction(null)
    setDeleteTargetId(null)
  }

  const handleDeleteChat = async (id: string) => {
    const res = await fetch("/api/local-chat?action=selected", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  const handleDeleteSelected = async () => {
    const res = await fetch("/api/local-chat?action=selected", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedMessages) }),
    })
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => !selectedMessages.has(m.id)))
      setSelectedMessages(new Set())
      setIsSelectionMode(false)
    }
  }

  const handleClearAll = async () => {
    const res = await fetch("/api/local-chat?action=all", { method: "DELETE" })
    if (res.ok) setMessages([])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER: Fixed height */}
      {messages.length > 0 && (
        <div className="shrink-0 border-b p-2 flex items-center justify-between gap-2 bg-background">
          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)} className="text-xs">
                  <CheckSquare className="w-3 h-3 mr-1" /> Select
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDeleteAction("all"); setDeleteDialogOpen(true); }} className="text-xs text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear All
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedMessages(new Set()); }} className="text-xs">
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
                <Button variant="destructive" size="sm" disabled={selectedMessages.size === 0} onClick={() => { setDeleteAction("multiple"); setDeleteDialogOpen(true); }} className="text-xs text-white">
                  Delete ({selectedMessages.size})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHAT AREA: Scrollable middle section */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <p className="text-lg font-semibold">Start your learning journey</p>
            <p className="text-sm">Ask anything about your notes.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2 group">
              {isSelectionMode && (
                <button onClick={() => {
                  const next = new Set(selectedMessages);
                  next.has(message.id) ? next.delete(message.id) : next.add(message.id);
                  setSelectedMessages(next);
                }} className="flex items-center gap-2 text-xs mb-1">
                  {selectedMessages.has(message.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                  <span>Select</span>
                </button>
              )}
              <div className="flex justify-end gap-2">
                {!isSelectionMode && (
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={() => { setDeleteTargetId(message.id); setDeleteAction("single"); setDeleteDialogOpen(true); }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
                <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[85%] text-sm">
                  {message.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div className={`bg-muted rounded-2xl px-4 py-2 max-w-[85%] text-sm ${selectedMessages.has(message.id) ? 'ring-2 ring-primary' : ''}`}>
                  <p className="text-[10px] font-bold uppercase opacity-50 mb-1">{message.mode.replace('_', ' ')}</p>
                  <p className="whitespace-pre-wrap">{message.answer}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER: Fixed height input */}
      <div className="shrink-0 border-t p-4 space-y-3 bg-background">
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SHORT">Short Answer</SelectItem>
            <SelectItem value="DETAILED">Detailed Answer</SelectItem>
            <SelectItem value="HINT_ONLY">Hint Only</SelectItem>
          </SelectContent>
        </Select>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input placeholder="Ask your question..." value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} className="flex-1" />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}