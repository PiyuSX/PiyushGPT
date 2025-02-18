import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  userId: {
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
chatSchema.index({ sessionId: 1, userId: 1 })

// Add hook to update the updatedAt timestamp
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema)

export type Chat = {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  userId: string;
  messages: {
    _id?: mongoose.Types.ObjectId;
    content: string;
    role: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

