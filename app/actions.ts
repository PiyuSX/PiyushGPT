'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { v4 as uuidv4 } from 'uuid'
import dbConnect from '@/lib/mongodb'
import { Chat } from '@/lib/models/chat'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// Sanitize the AI response to reflect proper branding
function sanitizeResponse(response: string): string {
  return response
    .replace(/gemini/gi, 'Piyush GPT') // Replace Gemini with Piyush GPT
    .replace(/google/gi, 'Piyush Rajbanshi') // Replace Google with Piyush Rajbanshi
}

export async function chat(messages: { role: string; content: string }[], sessionId?: string) {
  try {
    // Connect to MongoDB
    await dbConnect()

    // Generate or use existing session ID
    const currentSessionId = sessionId || uuidv4()

    // Get the last message as the current prompt
    const currentMessage = messages[messages.length - 1].content

    const result = await model.generateContent(currentMessage)
    let text = result.response.text()

    if (!text) {
      throw new Error('No response from AI')
    }

    // Sanitize the response
    text = sanitizeResponse(text)

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
      error: error instanceof Error ? error.message : 'Failed to get response from AI',
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
    return { chats: [], error: null } // Return empty array instead of null
  }
}

export async function deleteChat(sessionId: string) {
  try {
    await dbConnect()
    await Chat.deleteOne({ sessionId })
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting chat:', error)
    return { success: false, error: 'Failed to delete chat' }
  }
}