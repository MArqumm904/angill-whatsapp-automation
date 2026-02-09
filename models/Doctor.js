const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  whatsappNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  specialty: {
    type: String,
    default: null
  },
  
  // Conversation Stage
  currentStage: {
    type: String,
    enum: [
      'initial',
      'collecting_name',
      'collecting_city', 
      'collecting_specialty',
      'menu',
      'online_doctor',
      'cyber_clinic',
      'referral',
      'smart_calendar',
      'completed'
    ],
    default: 'initial'
  },
  
  // Selected Option
  selectedOption: {
    type: String,
    enum: ['online_doctor', 'cyber_clinic', 'referral', 'smart_calendar', null],
    default: null
  },
  
  // Engagement Tracking
  videoWatched: {
    type: Boolean,
    default: false
  },
  pdfDownloaded: {
    type: Boolean,
    default: false
  },
  callBooked: {
    type: Boolean,
    default: false
  },
  registered: {
    type: Boolean,
    default: false
  },
  linkGenerated: {
    type: Boolean,
    default: false
  },
  
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referralLink: {
    type: String,
    default: null
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  
  // Follow-up System
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  followUpCount: {
    type: Number,
    default: 0
  },
  nextFollowUpDate: {
    type: Date,
    default: null
  },
  followUpMessages: [{
    sentAt: Date,
    dayNumber: Number,
    messageType: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'warm_lead', 'converted', 'non_responsive', 'opted_out'],
    default: 'active'
  },
  
  // Metadata
  source: {
    type: String,
    default: 'whatsapp_leaflet'
  },
  tags: [String],
  notes: String
  
}, {
  timestamps: true
});

// Generate referral code before saving
doctorSchema.pre('save', function(next) {
  if (!this.referralCode && this.name) {
    const cleanName = this.name.replace(/\s+/g, '').toUpperCase();
    this.referralCode = `DR${cleanName.substring(0, 4)}${Date.now().toString().slice(-4)}`;
    this.referralLink = `https://angill.pk/join?ref=${this.referralCode}`;
  }
  next();
});

// Indexes
doctorSchema.index({ whatsappNumber: 1 });
doctorSchema.index({ referralCode: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ nextFollowUpDate: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);