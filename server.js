require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const webhookRouter = require('./routes/webhook');
const analyticsRouter = require('./routes/analytics');
const cronJobs = require('./jobs/cronJobs');

const app = express();

// Connect to MongoDB
connectDB();

// Initialize cron jobs
cronJobs.init();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (Enhanced)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⏰ ${timestamp}`);
  console.log(`📍 ${req.method} ${req.path}`);
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query:', req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  console.log(`${'='.repeat(60)}\n`);
  next();
});

// Routes
app.use('/webhook', webhookRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'active',
    service: 'Angill Clinic WhatsApp Automation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configuration check endpoint
app.get('/config/check', (req, res) => {
  res.json({
    mongodb: process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing',
    whatsapp: {
      accessToken: process.env.META_ACCESS_TOKEN ? '✅ Configured' : '❌ Missing',
      phoneNumberId: process.env.PHONE_NUMBER_ID ? '✅ Configured' : '❌ Missing',
      verifyToken: process.env.VERIFY_TOKEN ? '✅ Configured' : '❌ Missing'
    },
    urls: {
      onboardingVideo: process.env.ONBOARDING_VIDEO_URL ? '✅ Set' : '⚠️ Not Set',
      calendly: process.env.CALENDLY_URL ? '✅ Set' : '⚠️ Not Set'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    mongodb: 'connected',
    whatsapp: 'ready',
    cron: 'active',
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    endpoints: {
      webhook: {
        GET: '/webhook - Webhook verification',
        POST: '/webhook - Receive WhatsApp messages',
        GET_TEST: '/webhook/test - Test webhook status'
      },
      analytics: {
        GET: '/api/analytics/dashboard - Dashboard stats',
        GET: '/api/analytics/doctors/recent - Recent doctors',
        GET: '/api/analytics/doctors/:id - Doctor details',
        GET: '/api/analytics/funnel - Conversion funnel',
        GET: '/api/analytics/activity/daily - Daily activity',
        GET: '/api/analytics/doctors/search - Search doctors'
      },
      system: {
        GET: '/ - Health check',
        GET: '/config/check - Configuration status',
        GET: '/test - Test endpoint'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cronJobs.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  cronJobs.stop();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║     🚀 ANGILL CLINIC - WhatsApp Automation           ║
  ║                                                       ║
  ╟───────────────────────────────────────────────────────╢
  ║  📡 Server Running: http://localhost:${PORT}          ║
  ║  🗄️  MongoDB: ${process.env.MONGODB_URI ? '✅ Connected' : '❌ Not Connected'}                        ║
  ║  📱 WhatsApp: ${process.env.META_ACCESS_TOKEN ? '✅ Configured' : '❌ Not Configured'}                   ║
  ║  ⏰ Cron Jobs: ✅ Running                             ║
  ║  📊 Analytics: ✅ Available                          ║
  ╟───────────────────────────────────────────────────────╢
  ║  🔗 Important URLs:                                   ║
  ║  • Webhook: http://localhost:${PORT}/webhook         ║
  ║  • Dashboard: http://localhost:${PORT}/api/analytics  ║
  ║  • Config: http://localhost:${PORT}/config/check     ║
  ╚═══════════════════════════════════════════════════════╝
  
  ⚡ Ready to receive WhatsApp messages!
  `);
});

module.exports = server;