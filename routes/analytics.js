const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Interaction = require('../models/Interaction');

// Dashboard Overview
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {
      total: await Doctor.countDocuments(),
      active: await Doctor.countDocuments({ status: 'active' }),
      converted: await Doctor.countDocuments({ status: 'converted' }),
      warmLeads: await Doctor.countDocuments({ status: 'warm_lead' }),
      nonResponsive: await Doctor.countDocuments({ status: 'non_responsive' }),
      
      registered: await Doctor.countDocuments({ registered: true }),
      callsBooked: await Doctor.countDocuments({ callBooked: true }),
      videosWatched: await Doctor.countDocuments({ videoWatched: true }),
      pdfsDownloaded: await Doctor.countDocuments({ pdfDownloaded: true }),
      
      byOption: {
        onlineDoctor: await Doctor.countDocuments({ selectedOption: 'online_doctor' }),
        cyberClinic: await Doctor.countDocuments({ selectedOption: 'cyber_clinic' }),
        referral: await Doctor.countDocuments({ selectedOption: 'referral' }),
        smartCalendar: await Doctor.countDocuments({ selectedOption: 'smart_calendar' })
      },
      
      byCity: await Doctor.aggregate([
        { $match: { city: { $ne: null } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      bySpecialty: await Doctor.aggregate([
        { $match: { specialty: { $ne: null } } },
        { $group: { _id: '$specialty', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recent doctors
router.get('/doctors/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const doctors = await Doctor.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name city specialty selectedOption status createdAt lastInteraction');
    
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Doctor details
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    const interactions = await Interaction.find({ doctorId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({ success: true, doctor, interactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conversion funnel
router.get('/funnel', async (req, res) => {
  try {
    const total = await Doctor.countDocuments();
    const completedProfile = await Doctor.countDocuments({ 
      name: { $ne: null },
      city: { $ne: null },
      specialty: { $ne: null }
    });
    const selectedOption = await Doctor.countDocuments({ selectedOption: { $ne: null } });
    const engaged = await Doctor.countDocuments({ 
      $or: [
        { videoWatched: true },
        { pdfDownloaded: true },
        { callBooked: true }
      ]
    });
    const converted = await Doctor.countDocuments({ 
      $or: [
        { registered: true },
        { status: 'converted' }
      ]
    });
    
    const funnel = {
      stages: [
        { name: 'Total Contacts', count: total, percentage: 100 },
        { name: 'Completed Profile', count: completedProfile, percentage: (completedProfile/total*100).toFixed(1) },
        { name: 'Selected Option', count: selectedOption, percentage: (selectedOption/total*100).toFixed(1) },
        { name: 'Engaged', count: engaged, percentage: (engaged/total*100).toFixed(1) },
        { name: 'Converted', count: converted, percentage: (converted/total*100).toFixed(1) }
      ]
    };
    
    res.json({ success: true, funnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily activity
router.get('/activity/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activity = await Interaction.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          messages: {
            $sum: { $cond: [{ $eq: ['$type', 'message_received'] }, 1, 0] }
          },
          buttons: {
            $sum: { $cond: [{ $eq: ['$type', 'button_clicked'] }, 1, 0] }
          },
          videos: {
            $sum: { $cond: [{ $eq: ['$type', 'video_watched'] }, 1, 0] }
          },
          pdfs: {
            $sum: { $cond: [{ $eq: ['$type', 'pdf_downloaded'] }, 1, 0] }
          },
          calls: {
            $sum: { $cond: [{ $eq: ['$type', 'call_booked'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search doctors
router.get('/doctors/search', async (req, res) => {
  try {
    const { query, status, city, specialty } = req.query;
    
    let filter = {};
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { whatsappNumber: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (specialty) filter.specialty = specialty;
    
    const doctors = await Doctor.find(filter)
      .sort({ lastInteraction: -1 })
      .limit(50);
    
    res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;