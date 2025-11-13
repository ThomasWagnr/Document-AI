import type { Message } from "@/components/chat-interface"
import { DocumentSource } from "@/components/document-source"
import { Card } from "@/components/ui/card"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-4", isUser && "justify-end")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div className={cn("flex-1 space-y-4", isUser && "max-w-[80%]")}>
        <Card className={cn("p-4", isUser ? "bg-primary text-primary-foreground" : "bg-card")}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </Card>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>{"Retrieved Sources"}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3">
              {message.sources.map((source) => (
                <DocumentSource key={source.id} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
