'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { v4 as uuidv4 } from 'uuid'
import dbConnect from '@/lib/mongodb'
import { Chat } from '@/lib/models/chat'

function replaceText(text: string): string {
  return text
    .replace(/\bGoogle\b/g, "Piyush")
    .replace(/\bGemini\b/g, "PiyushGPT");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

export async function chat(messages: { role: string; content: string }[], sessionId?: string, userId: string) {
  try {
    await dbConnect()

    const currentSessionId = sessionId || uuidv4()
    const currentMessage = messages[messages.length - 1].content

    const result = await model.generateContent(currentMessage)
    let text = result.response.text()

    if (!text) {
      throw new Error('No response from AI')
    }

    text = replaceText(text)

    await Chat.findOneAndUpdate(
      { sessionId: currentSessionId, userId: userId },
      {
        $set: { 
          sessionId: currentSessionId,
          userId: userId,
          updatedAt: new Date()
        },
        $push: { 
          messages: {
            $each: [
              ...messages,
              { role: 'assistant', content: text, createdAt: new Date() }
            ]
          }
        }
      },
      { upsert: true, new: true }
    )

    // Delete chats older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await Chat.deleteMany({ updatedAt: { $lt: thirtyDaysAgo } })

    return { 
      content: text, 
      error: null,
      sessionId: currentSessionId
    }
  } catch (error) {
    console.error('Chat error:', error)
    return { 
      content: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      sessionId: null
    }
  }
}

export async function getRecentChats(userId: string) {
  try {
    await dbConnect()
    const recentChats = await Chat.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .limit(25)
      .lean()
      .exec()

    // Serialize the chats to avoid issues with Date and ObjectId
    const serializedChats = recentChats.map(chat => ({
      ...chat,
      _id: chat._id.toString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      messages: chat.messages.map(msg => ({
        ...msg,
        _id: msg._id.toString(),
        createdAt: msg.createdAt.toISOString()
      }))
    }))

    return { chats: serializedChats, error: null }
  } catch (error) {
    console.error('Error fetching recent chats:', error)
    return { chats: [], error: 'Failed to fetch recent chats' }
  }
}

export async function deleteChat(sessionId: string, userId: string) {
  try {
    await dbConnect()
    await Chat.deleteOne({ sessionId, userId: userId })
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting chat:', error)
    return { success: false, error: 'Failed to delete chat' }
  }
}

