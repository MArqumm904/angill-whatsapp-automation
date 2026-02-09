# 🚀 ANGILL Clinic - WhatsApp Automation System

## 📋 Overview
Automated WhatsApp bot for doctor onboarding, lead nurturing, and conversion tracking using Meta WhatsApp Business API.

## ✅ Complete System Components

### Core Files Created
- ✅ `server.js` - Main Express server
- ✅ `config/database.js` - MongoDB connection
- ✅ `models/Doctor.js` - Doctor schema
- ✅ `models/Conversation.js` - Conversation history schema
- ✅ `models/Interaction.js` - Interaction tracking schema
- ✅ `controllers/messageController.js` - Message handling logic
- ✅ `services/whatsappService.js` - WhatsApp API integration
- ✅ `services/followUpService.js` - Automated follow-up system
- ✅ `routes/webhook.js` - Webhook endpoints
- ✅ `routes/analytics.js` - Analytics & reporting
- ✅ `jobs/cronJobs.js` - Scheduled tasks
- ✅ `.env` - Environment configuration
- ✅ `.env.example` - Environment template

## 🔧 Setup Instructions

### 1. Prerequisites
```bash
Node.js >= 16.x
MongoDB Atlas account
Meta WhatsApp Business API access
```

### 2. Installation
```bash
# Clone repository
git clone <your-repo>
cd angill-whatsapp-automation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

### 3. Environment Variables Setup

#### Required Variables (Must Configure):
```env
# Meta WhatsApp API (from Meta Business Suite)
META_ACCESS_TOKEN=your_actual_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_custom_verify_token

# MongoDB (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Video Links (Upload to YouTube)
ONBOARDING_VIDEO_URL=https://youtu.be/xxxxx
SMART_CALENDAR_DEMO_URL=https://youtu.be/xxxxx

# PDF Documents (Host on CDN or server)
CYBER_CLINIC_PDF_URL=https://cdn.example.com/cyber_clinic.pdf
ROI_PDF_URL=https://cdn.example.com/roi.pdf
COST_PLAN_PDF_URL=https://cdn.example.com/cost.pdf

# Booking & Registration
CALENDLY_URL=https://calendly.com/your-link
REGISTRATION_URL=https://angill.pk/doctor-register
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📱 WhatsApp Business API Setup

### Step 1: Create Meta Business App
1. Go to https://developers.facebook.com
2. Create new app → Business → WhatsApp
3. Add WhatsApp product
4. Get Phone Number ID and Access Token

### Step 2: Configure Webhook
1. In Meta Dashboard, go to WhatsApp → Configuration
2. Set Webhook URL: `https://your-domain.com/webhook`
3. Set Verify Token: Same as `VERIFY_TOKEN` in .env
4. Subscribe to: `messages` events

### Step 3: Test Webhook
```bash
# Test endpoint
curl http://localhost:3000/webhook/test

# Check configuration
curl http://localhost:3000/config/check
```

## 🗂️ Project Structure
```
angill-whatsapp-automation/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   └── messageController.js # Main message logic
├── models/
│   ├── Doctor.js            # Doctor schema
│   ├── Conversation.js      # Chat history
│   └── Interaction.js       # Analytics tracking
├── routes/
│   ├── webhook.js           # WhatsApp webhook
│   └── analytics.js         # Dashboard API
├── services/
│   ├── whatsappService.js   # WhatsApp API calls
│   └── followUpService.js   # Auto follow-up
├── jobs/
│   └── cronJobs.js          # Scheduled tasks
├── .env                     # Configuration
├── .env.example             # Template
├── server.js                # Entry point
└── package.json
```

## 🎯 Workflow

### User Journey:
1. **Doctor sends message** → System creates profile
2. **Bot collects info** → Name, City, Specialty
3. **Shows menu** → 4 options (Online Doctor, Cyber Clinic, Referral, Smart Calendar)
4. **Doctor selects option** → Sends relevant content (video/PDF/links)
5. **Call booking** → Calendly integration
6. **Follow-ups** → Day 1, 3, 5, 7 automated reminders

### All Button Handlers Implemented:
✅ `yes_call` - Books orientation call
✅ `no_call` - Marks as warm lead
✅ `roi_calc` - Sends ROI PDF
✅ `cost_plan` - Sends cost breakdown PDF
✅ `schedule_call` - Opens Calendly
✅ `yes_referral` - Generates unique referral link
✅ `no_referral` - Skips referral setup
✅ `yes_demo` - Books live demo
✅ `no_demo` - Continues without demo

## 📊 Analytics Endpoints

### Available Routes:
```bash
# Dashboard stats
GET /api/analytics/dashboard

# Recent doctors
GET /api/analytics/doctors/recent?limit=20

# Doctor details
GET /api/analytics/doctors/:id

# Conversion funnel
GET /api/analytics/funnel

# Daily activity
GET /api/analytics/activity/daily?days=7

# Search doctors
GET /api/analytics/doctors/search?query=Ahmed&city=Karachi
```

## 🔄 Automated Follow-ups

### Schedule:
- **Day 1** (24 hours): Gentle reminder
- **Day 3** (72 hours): Success story
- **Day 5** (120 hours): Benefits + urgency
- **Day 7** (168 hours): Final offer

### Cron Jobs:
```javascript
// Follow-ups run every hour
'0 * * * *'

// Daily stats at 9 AM
'0 9 * * *'

// Weekly cleanup (Sunday midnight)
'0 0 * * 0'
```

## 🎨 Message Templates

All messages are in **Roman Urdu** for better engagement with Pakistani doctors.

### Supported Message Types:
- ✅ Text messages
- ✅ Button messages (max 3 buttons)
- ✅ List messages (4+ options)
- ✅ Documents (PDFs)
- ✅ Images
- ✅ Videos

## 🔐 Security Features

- ✅ Webhook verification token
- ✅ Environment variable encryption
- ✅ MongoDB connection security
- ✅ Message validation
- ✅ Rate limiting ready

## 📈 Database Models

### Doctor Schema
```javascript
{
  whatsappNumber: String (unique),
  name: String,
  city: String,
  specialty: String,
  currentStage: Enum,
  selectedOption: Enum,
  videoWatched: Boolean,
  pdfDownloaded: Boolean,
  callBooked: Boolean,
  registered: Boolean,
  referralCode: String (unique),
  referralLink: String,
  status: Enum,
  followUpCount: Number,
  nextFollowUpDate: Date
}
```

### Conversation Schema
```javascript
{
  doctorId: ObjectId,
  whatsappNumber: String,
  messages: [{
    messageId: String,
    timestamp: Date,
    type: Enum (incoming/outgoing),
    content: String,
    messageType: Enum
  }]
}
```

### Interaction Schema
```javascript
{
  doctorId: ObjectId,
  type: Enum (message_received, button_clicked, etc.),
  details: Object,
  timestamp: Date
}
```

## 🧪 Testing

### Manual Testing:
1. Send "Hello" to your WhatsApp Business number
2. Bot should respond with welcome message
3. Follow the conversation flow
4. Test all button clicks

### API Testing:
```bash
# Health check
curl http://localhost:3000/

# Configuration check
curl http://localhost:3000/config/check

# Dashboard
curl http://localhost:3000/api/analytics/dashboard
```

## 🚨 Troubleshooting

### Common Issues:

1. **Webhook not receiving messages**
   - Check VERIFY_TOKEN matches Meta config
   - Ensure server is publicly accessible
   - Check Meta webhook subscription

2. **Messages not sending**
   - Verify META_ACCESS_TOKEN is valid
   - Check PHONE_NUMBER_ID is correct
   - Ensure 24-hour message window

3. **Database connection failed**
   - Verify MongoDB URI format
   - Check IP whitelist in MongoDB Atlas
   - Test connection string

4. **Follow-ups not working**
   - Check cron job is running
   - Verify doctor has nextFollowUpDate set
   - Check followUpCount < 4

## 📝 Missing Components Checklist

All components are now complete! ✅

Previously missing items (now added):
- ✅ Conversation model
- ✅ Button handlers (yes_referral, no_referral, yes_demo, no_demo)
- ✅ Analytics router properly configured
- ✅ All environment variables documented
- ✅ Referral link generation

## 🎯 Next Steps

1. **Upload PDFs** to CDN and update URLs in .env
2. **Create YouTube videos** and update video URLs
3. **Set up Calendly** account and update booking URL
4. **Configure Meta WhatsApp** Business API
5. **Deploy to production** server (Render, Railway, DigitalOcean)
6. **Set up domain** and SSL certificate
7. **Test end-to-end** with real WhatsApp number

## 📞 Support

For issues or questions:
- Check logs: `console.log` statements throughout code
- Enable DEBUG_MODE=true in .env
- Review Meta WhatsApp API documentation

## 📄 License

Proprietary - ANGILL Clinic