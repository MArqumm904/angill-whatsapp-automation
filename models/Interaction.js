const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  
  // Interaction Type
  type: {
    type: String,
    enum: [
      'message_sent',
      'message_received',
      'button_clicked',
      'link_clicked',
      'video_watched',
      'pdf_downloaded',
      'call_booked',
      'registration_completed',
      'referral_generated'
    ],
    required: true
  },
  
  // Details
  details: {
    buttonId: String,
    linkUrl: String,
    messageContent: String,
    optionSelected: String
  },
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Indexes
interactionSchema.index({ doctorId: 1, timestamp: -1 });
interactionSchema.index({ type: 1 });

module.exports = mongoose.model('Interaction', interactionSchema);