const Doctor = require('../models/Doctor');
const whatsappService = require('./whatsappService');

class FollowUpService {
  
  // Main cron job - runs every hour
  async processFollowUps() {
    try {
      console.log('🔄 Processing follow-ups...');
      
      const now = new Date();
      
      // Find doctors who need follow-up
      const doctors = await Doctor.find({
        status: { $in: ['active', 'warm_lead'] },
        nextFollowUpDate: { $lte: now },
        followUpCount: { $lt: 4 }, // Max 4 follow-ups (Day 1, 3, 5, 7)
        $or: [
          { registered: false },
          { callBooked: false }
        ]
      });
      
      console.log(`📊 Found ${doctors.length} doctors for follow-up`);
      
      for (const doctor of doctors) {
        await this.sendFollowUp(doctor);
      }
      
    } catch (error) {
      console.error('Error in follow-up processing:', error);
    }
  }
  
  // Send follow-up based on day
  async sendFollowUp(doctor) {
    try {
      const followUpDay = doctor.followUpCount + 1;
      let message = '';
      
      switch(followUpDay) {
        case 1:
          message = this.getDay1Message(doctor);
          break;
        case 2:
          message = this.getDay3Message(doctor);
          break;
        case 3:
          message = this.getDay5Message(doctor);
          break;
        case 4:
          message = this.getDay7Message(doctor);
          break;
      }
      
      // Send message
      await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
      
      // Update doctor
      doctor.followUpCount = followUpDay;
      doctor.followUpMessages.push({
        sentAt: new Date(),
        dayNumber: followUpDay,
        messageType: `day_${followUpDay * 2 - 1}`
      });
      
      // Set next follow-up date
      if (followUpDay < 4) {
        const daysToAdd = followUpDay === 1 ? 2 : 2; // Day 1 → Day 3 → Day 5 → Day 7
        doctor.nextFollowUpDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
      } else {
        doctor.status = 'non_responsive';
        doctor.nextFollowUpDate = null;
      }
      
      await doctor.save();
      
      console.log(`✅ Follow-up ${followUpDay} sent to Dr. ${doctor.name}`);
      
    } catch (error) {
      console.error(`Error sending follow-up to ${doctor.whatsappNumber}:`, error);
    }
  }
  
  // Day 1 Follow-up (After 24 hours)
  getDay1Message(doctor) {
    return `👋 *Dr. ${doctor.name}*

This is a quick reminder.

You had inquired about Angill. I hope you received all the details you needed.

If you need any help or have any questions, please feel free to reply.

_I'm here to help!_ 😊`;
  }
  
  // Day 3 Follow-up (Success story)
  getDay3Message(doctor) {
    return `⭐ *Dr. ${doctor.name}*

I'd like to share a success story:

*Dr. Ahmed (Karachi)* joined Angill 3 months ago. He increased his monthly income by *35%* just by using the Smart Calendar.

He now has:
✔ Double appointments
✔ Online + clinic consultations
✔ Better time management

Would you also like these benefits?

_Reply and I'll help you get started!_ 🚀`;
  }
  
  // Day 5 Follow-up (Brochure + Benefits)
  getDay5Message(doctor) {
    return `📋 *Dr. ${doctor.name}*

Angill's *key benefits* at a glance:

💰 *25-40% more income*
📅 Smart Calendar (Patent Pending)
🏥 Hybrid model (Online + Clinic)
📱 Easy digital management
💳 Flexible payment plans

*Only 50 slots available for doctors.*

Are you interested?

_If yes, please reply "Yes"!_ ✅`;
  }
  
  // Day 7 Follow-up (Final gentle nudge)
  getDay7Message(doctor) {
    return `🕐 *Dr. ${doctor.name}*

This is my last message.

Angill is onboarding the *next 50 doctors* with *early benefits + priority listing*.

If you're interested, please:
1️⃣ Reply "Interested"
2️⃣ Or book a call directly: ${process.env.CALENDLY_URL}

*If you're not interested*, that's okay — I won't disturb you anymore.

_Best wishes!_ 🙏`;
  }
  
  // Manual follow-up trigger (for testing)
  async sendManualFollowUp(whatsappNumber) {
    const doctor = await Doctor.findOne({ whatsappNumber });
    if (doctor) {
      await this.sendFollowUp(doctor);
      return { success: true, message: 'Follow-up sent' };
    }
    return { success: false, message: 'Doctor not found' };
  }
}

module.exports = new FollowUpService();