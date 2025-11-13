"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Calendar, User, ChevronDown, ChevronUp } from "lucide-react"

export interface DocumentSource {
  id: string
  title: string
  excerpt: string
  relevanceScore?: number
  metadata?: {
    author?: string
    date?: string
    pageNumber?: number
    documentId?: number
    chunkId?: number
  }
}

interface DocumentSourceProps {
  source: DocumentSource
}

export function DocumentSource({ source }: DocumentSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1 mb-1">{source.title}</h4>
              <p className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                {source.excerpt}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {source.metadata && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {source.metadata.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{source.metadata.author}</span>
              </div>
            )}
            {source.metadata.date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{source.metadata.date}</span>
              </div>
            )}
            {source.metadata.pageNumber && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{`Page ${source.metadata.pageNumber}`}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
