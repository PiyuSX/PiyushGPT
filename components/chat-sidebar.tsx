'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Trash2, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { deleteChat } from "@/app/actions/chat"
import { toast } from "sonner"
import type { ChatSession } from "@/types/chat"
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onSessionDelete: (sessionId: string) => void
  onNewChat: () => void
}

export function ChatSidebar({ 
  sessions, 
  currentSessionId, 
  onSessionSelect,
  onSessionDelete,
  onNewChat
}: ChatSidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [user] = useAuthState(auth)

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.uid) {
      toast.error('User not authenticated')
      return
    }
    try {
      setDeletingId(sessionId)
      const { success, error } = await deleteChat(sessionId, user.uid)
      if (error) throw new Error(error)
      if (success) {
        onSessionDelete(sessionId)
        toast.success('Chat deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete chat')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full justify-start">
          <MessageSquare className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sessions.map((session) => {
            const firstMessage = session.messages[0]?.content || 'New Chat'
            const preview = firstMessage.length > 40 ? `${firstMessage.substring(0, 40)}...` : firstMessage

            return (
              <div
                key={session.sessionId}
                className={`group relative rounded-lg transition-colors ${
                  session.sessionId === currentSessionId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => onSessionSelect(session.sessionId)}
                  className="w-full p-3 text-left pr-12"
                >
                  <div className="text-sm font-medium">{preview}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    deletingId === session.sessionId ? 'opacity-100' : ''
                  }`}
                  onClick={(e) => handleDelete(session.sessionId, e)}
                  disabled={deletingId === session.sessionId}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

