"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessage } from "@/components/chat-message"
import { DocumentUploadDialog } from "@/components/document-upload-dialog"
import { Send, Loader2, Upload } from "lucide-react"
import { askQuestion } from "@/lib/api"
import { toast } from "sonner"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: any[]
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const query = input.trim()
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await askQuestion(query, 5)
      
      // Transform the API response to match the Message interface
      const sources = response.context.map((chunk, index) => {
        const docLabel = chunk.document_name?.trim() || `Document ${chunk.document_id}`
        return {
          id: chunk.id.toString(),
          title: `${docLabel} - Chunk ${chunk.id}`,
          excerpt: chunk.content,
          relevanceScore: 1.0 - index * 0.1, // Simple relevance scoring based on order
          metadata: {
            documentId: chunk.document_id,
            documentName: chunk.document_name,
            chunkId: chunk.id,
          },
        }
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        sources: sources,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error asking question:", error)
      toast.error("Failed to get answer. Please make sure the backend is running and you have uploaded some documents.")
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error while processing your question. Please try again or make sure you have uploaded some documents first.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader />

      <ScrollArea className="flex-1 px-4">
        <div className="mx-auto max-w-4xl py-8">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-balance">{"Ask anything about your documents"}</h2>
                  <p className="text-muted-foreground text-pretty max-w-md mx-auto">
                    {"Get AI-powered answers backed by relevant document sources. Start by typing your question below."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{"Retrieving documents and generating response..."}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="flex gap-2 items-end">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
              className="h-[60px] shrink-0"
              title="Upload documents"
            >
              <Upload className="w-5 h-5" />
              <span className="sr-only">{"Upload documents"}</span>
            </Button>
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents..."
                className="min-h-[60px] max-h-[200px] resize-none pr-12 bg-card"
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">{"⏎"}</span>
                </kbd>
              </div>
            </div>
            <Button type="submit" size="lg" disabled={!input.trim() || isLoading} className="h-[60px]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="sr-only">{"Send message"}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{"Press Enter to send, Shift + Enter for new line"}</p>
        </form>
      </div>

      <DocumentUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  )
}
