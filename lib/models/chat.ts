import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  messages: [{
    content: String,
    role: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Create compound index for efficient querying and automatic deletion
chatSchema.index({ updatedAt: -1 })
chatSchema.index({ sessionId: 1 })

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema)

