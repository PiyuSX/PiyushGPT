export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
}

export interface ChatSession {
  sessionId: string
  userId: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

