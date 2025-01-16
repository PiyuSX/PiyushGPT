'use client'

import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Send, Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { chat, getRecentChats, deleteChat } from './actions/chat'
import { signOut } from '@/lib/auth-utils'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthForm } from '@/components/auth-form'
import { UpdateUsername } from '@/components/update-username'
import type { Message } from '@/types/chat'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

function replaceText(text: string): string {
  return text
    .replace(/\bGoogle\b/g, "Piyush")
    .replace(/\bGemini\b/g, "PiyushGPT");
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [user, loading] = useAuthState(auth)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  useEffect(() => {
    if (user) {
      loadRecentChats()
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.profile-dropdown')) {
          setIsProfileOpen(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileOpen])

  const loadRecentChats = async () => {
    try {
      const { chats, error } = await getRecentChats(user!.uid)
      if (error) {
        console.error(error)
        return
      }
      setSessions(chats || [])
      if (chats && chats.length > 0 && !sessionId) {
        const mostRecentChat = chats[0]
        setSessionId(mostRecentChat.sessionId)
        setMessages(mostRecentChat.messages.map((msg: any) => ({
          ...msg,
          id: msg._id,
          createdAt: new Date(msg.createdAt)
        })))
      }
    } catch (error) {
      console.error('Failed to load recent chats:', error)
    }
  }

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      toast.success('Logged out successfully')
      setMessages([])
      setSessions([])
      setSessionId(null)
    } else {
      toast.error(result.error)
    }
  }

  const handleSessionSelect = (selectedSessionId: string) => {
    const session = sessions.find(s => s.sessionId === selectedSessionId)
    if (session) {
      setSessionId(selectedSessionId)
      setMessages(session.messages.map((msg: any) => ({
        ...msg,
        id: msg._id,
        content: msg.role === 'assistant' ? replaceText(msg.content) : msg.content,
        createdAt: new Date(msg.createdAt)
      })))
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }
  }

  const startNewChat = () => {
    setSessionId(null)
    setMessages([])
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: uuidv4(),
      content: input.trim(),
      role: 'user',
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      chatMessages.push({
        role: 'user',
        content: input.trim(),
      })

      const { content, error, sessionId: newSessionId } = await chat(chatMessages, user.uid, sessionId ?? undefined)

      if (error) {
        throw new Error(error)
      }

      if (!content) {
        throw new Error('No response received')
      }

      if (newSessionId) {
        setSessionId(newSessionId)
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        content: replaceText(content),
        role: 'assistant',
        createdAt: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      await loadRecentChats()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionDelete = async (deletedSessionId: string) => {
    const result = await deleteChat(deletedSessionId, user!.uid)
    if (result.success) {
      setSessions(prev => prev.filter(session => session.sessionId !== deletedSessionId))
      if (sessionId === deletedSessionId) {
        setSessionId(null)
        setMessages([])
      }
      toast.success('Chat deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete chat')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <ChatSidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
          onNewChat={startNewChat}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b p-4 flex justify-between items-center bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Piyush GPT</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.displayName || user.email}
            </span>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="profile-dropdown"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {isProfileOpen && (
          <div className="absolute right-4 top-16 w-80 p-6 bg-background border rounded-lg shadow-lg z-50 profile-dropdown">
            <UpdateUsername onClose={() => setIsProfileOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-hidden bg-background">
          <ScrollArea className="h-full p-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  Start a conversation by typing a message below.
                </div>
              )}
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p>{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </main>

        <footer className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              className="bg-background text-foreground"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </footer>
      </div>
    </div>
  )
}

