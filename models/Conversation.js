const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  
  // Conversation Messages
  messages: [{
    messageId: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    messageType: {
      type: String,
      enum: ['text', 'button', 'list', 'interactive', 'image', 'video', 'document', 'template'],
      default: 'text'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    }
  }],
  
  // Metadata
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Update lastMessageAt and messageCount before saving
conversationSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
    this.messageCount = this.messages.length;
  }
  next();
});

// Indexes
conversationSchema.index({ doctorId: 1 });
conversationSchema.index({ whatsappNumber: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);