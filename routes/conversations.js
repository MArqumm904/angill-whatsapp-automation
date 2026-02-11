const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Doctor = require('../models/Doctor');

// Get all conversations with doctor info
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1, search } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    let query = {};
    
    // Search by doctor name or phone
    if (search) {
      const doctors = await Doctor.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { whatsappNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const doctorIds = doctors.map(d => d._id);
      query.doctorId = { $in: doctorIds };
    }
    
    const conversations = await Conversation.find(query)
      .populate('doctorId', 'name city specialty whatsappNumber status currentStage')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Conversation.countDocuments(query);
    
    res.json({
      success: true,
      conversations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get conversation by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ doctorId: req.params.doctorId })
      .populate('doctorId', 'name city specialty whatsappNumber status currentStage referralCode');
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'No conversation found for this doctor' 
      });
    }
    
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get conversation by conversation ID
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('doctorId', 'name city specialty whatsappNumber status currentStage');
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }
    
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get conversation statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const activeConversations = await Conversation.countDocuments({ isActive: true });
    
    // Average messages per conversation
    const avgMessages = await Conversation.aggregate([
      {
        $group: {
          _id: null,
          avgCount: { $avg: '$messageCount' }
        }
      }
    ]);
    
    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await Conversation.countDocuments({
      lastMessageAt: { $gte: oneDayAgo }
    });
    
    // Top active conversations
    const topActive = await Conversation.find()
      .populate('doctorId', 'name specialty city')
      .sort({ messageCount: -1 })
      .limit(5)
      .select('doctorId messageCount lastMessageAt');
    
    res.json({
      success: true,
      stats: {
        total: totalConversations,
        active: activeConversations,
        averageMessages: avgMessages[0]?.avgCount || 0,
        recentActivity,
        topActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search conversations
router.get('/search/query', async (req, res) => {
  try {
    const { q, status, dateFrom, dateTo } = req.query;
    
    let query = {};
    
    // Search in message content
    if (q) {
      query['messages.content'] = { $regex: q, $options: 'i' };
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      query.lastMessageAt = {};
      if (dateFrom) query.lastMessageAt.$gte = new Date(dateFrom);
      if (dateTo) query.lastMessageAt.$lte = new Date(dateTo);
    }
    
    const conversations = await Conversation.find(query)
      .populate('doctorId', 'name city specialty whatsappNumber status')
      .sort({ lastMessageAt: -1 })
      .limit(50);
    
    res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;