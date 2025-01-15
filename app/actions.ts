'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { v4 as uuidv4 } from 'uuid'
import dbConnect from '@/lib/mongodb'
import { Chat } from '@/lib/models/chat'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

export async function chat(messages: { role: string; content: string }[], sessionId?: string) {
  try {
    // Connect to MongoDB
    try {
      await dbConnect()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      throw new Error('Failed to connect to the database. Please check your connection string.')
    }

    // Generate or use existing session ID
    const currentSessionId = sessionId || uuidv4()

    // Get the last message as the current prompt
    const currentMessage = messages[messages.length - 1].content

    const result = await model.generateContent(currentMessage)
    const text = result.response.text()

    if (!text) {
      throw new Error('No response from AI')
    }

    // Store the conversation in MongoDB
    try {
      await Chat.findOneAndUpdate(
        { sessionId: currentSessionId },
        {
          $set: { 
            sessionId: currentSessionId,
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

      // Keep only the most recent 25 chat sessions
      const allChats = await Chat.find().sort({ updatedAt: -1 })
      if (allChats.length > 25) {
        const chatsToDelete = allChats.slice(25)
        await Chat.deleteMany({
          _id: { $in: chatsToDelete.map(chat => chat._id) }
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue execution even if DB fails
    }

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

export async function getRecentChats() {
  try {
    await dbConnect()
    const recentChats = await Chat.find()
      .sort({ updatedAt: -1 })
      .limit(25)
      .lean()
      .exec()
    return { chats: recentChats, error: null }
  } catch (error) {
    console.error('Error fetching recent chats:', error)
    return { chats: [], error: 'Failed to fetch recent chats. Please check your database connection.' }
  }
}

export async function deleteChat(sessionId: string) {
  try {
    await dbConnect()
    await Chat.deleteOne({ sessionId })
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting chat:', error)
    return { success: false, error: 'Failed to delete chat. Please check your database connection.' }
  }
}

