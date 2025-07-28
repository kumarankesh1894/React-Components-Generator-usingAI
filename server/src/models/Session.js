// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // Auto-save state management
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  currentState: {
    // Current working code and CSS
    currentCode: {
      type: String,
      default: '',
    },
    currentCSS: {
      type: String,
      default: '',
    },
    // Current prompt being worked on
    currentPrompt: {
      type: String,
      default: '',
    },
    // Chat messages history
    chatHistory: [{
      sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      // Optional: store associated code for AI responses
      associatedCode: {
        type: String,
        default: '',
      },
    }],
    // UI state
    expandedSection: {
      type: String,
      enum: ['prompt', 'output', 'edit', 'history'],
      default: 'prompt',
    },
  },
  // Session metadata
  totalGenerations: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
