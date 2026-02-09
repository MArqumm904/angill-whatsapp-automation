const Doctor = require('../models/Doctor');
const Conversation = require('../models/Conversation');
const Interaction = require('../models/Interaction');
const whatsappService = require('../services/whatsappService');

class MessageController {
  
  // Main handler
  async handleIncomingMessage(messageData) {
    try {
      const { from, text, messageId, timestamp, type, buttonPayload, listPayload } = messageData;
      
      await whatsappService.markAsRead(messageId);
      
      let doctor = await Doctor.findOne({ whatsappNumber: from });
      
      if (!doctor) {
        doctor = await this.createNewDoctor(from);
        await this.sendWelcomeMessage(from);
      } else {
        // Handle button clicks
        if (buttonPayload) {
          await this.handleButtonClick(doctor, buttonPayload);
        } else if (listPayload) {
          await this.handleListSelection(doctor, listPayload);
        } else {
          await this.processTextMessage(doctor, text);
        }
      }
      
      // Track interaction
      await this.trackInteraction(doctor._id, from, 'message_received', { messageContent: text });
      
      // Save conversation
      await this.saveConversation(doctor._id, from, messageId, timestamp, 'incoming', text || buttonPayload, type);
      
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  // Create new doctor
  async createNewDoctor(phoneNumber) {
    const doctor = new Doctor({
      whatsappNumber: phoneNumber,
      currentStage: 'initial',
      lastInteraction: new Date(),
      nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Day 1 follow-up
    });
    await doctor.save();
    console.log(`✅ New doctor: ${phoneNumber}`);
    return doctor;
  }
  
  // Welcome message
  async sendWelcomeMessage(to) {
    const welcomeText = `🙏 *Thank you for your interest in ANGILL Hybrid Healthcare!*

I'm here to help you.

Before we proceed, may I know:

*1️⃣ Your Full Name?*`;

    await whatsappService.sendTextMessage(to, welcomeText);
    await Doctor.updateOne({ whatsappNumber: to }, { 
      currentStage: 'collecting_name',
      lastInteraction: new Date() 
    });
  }
  
  // Process text messages
  async processTextMessage(doctor, text) {
    const cleanText = text.trim();
    
    switch(doctor.currentStage) {
      case 'collecting_name':
        await this.collectName(doctor, cleanText);
        break;
      case 'collecting_city':
        await this.collectCity(doctor, cleanText);
        break;
      case 'collecting_specialty':
        await this.collectSpecialty(doctor, cleanText);
        break;
      case 'menu':
        await this.handleMenuKeyword(doctor, cleanText);
        break;
      default:
        await this.handleGeneralMessage(doctor, cleanText);
    }
    
    doctor.lastInteraction = new Date();
    await doctor.save();
  }
  
  // Collect name
  async collectName(doctor, name) {
    doctor.name = name;
    doctor.currentStage = 'collecting_city';
    await doctor.save();
    
    await whatsappService.sendTextMessage(
      doctor.whatsappNumber,
      `Great, *Dr. ${name}*! 👨‍⚕️\n\n*2️⃣ Which city are you from?* 🏙️`
    );
  }
  
  // Collect city
  async collectCity(doctor, city) {
    doctor.city = city;
    doctor.currentStage = 'collecting_specialty';
    await doctor.save();
    
    await whatsappService.sendTextMessage(
      doctor.whatsappNumber,
      `Great! ${city} 📍\n\n*3️⃣ What is your specialty?*\n\n_Example: Cardiologist, Dentist, Orthopedic, General Physician_`
    );
  }
  
  // Collect specialty and show menu
  async collectSpecialty(doctor, specialty) {
    doctor.specialty = specialty;
    doctor.currentStage = 'menu';
    await doctor.save();
    
    const thankYouText = `✅ *Thank you Dr. ${doctor.name}!*

Your details have been saved:
📍 *City:* ${doctor.city}
🩺 *Specialty:* ${doctor.specialty}

Let me show you the options... 👇`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, thankYouText);
    
    setTimeout(() => this.sendMainMenu(doctor.whatsappNumber), 2000);
  }
  
  // Main menu with list (4 options)
  async sendMainMenu(to) {
    const sections = [{
      title: "Angill Options",
      rows: [
        {
          id: "online_doctor",
          title: "Online Doctor",
          description: "Join as Online Consulting Doctor"
        },
        {
          id: "cyber_clinic",
          title: "Cyber Clinic",
          description: "Convert clinic to Angill Cyber Clinic"
        },
        {
          id: "referral",
          title: "Referral Program",
          description: "Earn by referring doctors"
        },
        {
          id: "smart_calendar",
          title: "Smart Calendar",
          description: "Patent Pending Dual Slot System"
        }
      ]
    }];
    
    await whatsappService.sendListMessage(
      to,
      "🔹 *Please choose what you want to explore:*",
      "Select Option",
      sections
    );
  }
  
  // Handle list selection
  async handleListSelection(doctor, payload) {
    doctor.selectedOption = payload;
    await doctor.save();
    
    await this.trackInteraction(doctor._id, doctor.whatsappNumber, 'button_clicked', { 
      buttonId: payload 
    });
    
    switch(payload) {
      case 'online_doctor':
        await this.handleOnlineDoctor(doctor);
        break;
      case 'cyber_clinic':
        await this.handleCyberClinic(doctor);
        break;
      case 'referral':
        await this.handleReferral(doctor);
        break;
      case 'smart_calendar':
        await this.handleSmartCalendar(doctor);
        break;
    }
  }
  
  // Handle button clicks
  async handleButtonClick(doctor, payload) {
    await this.trackInteraction(doctor._id, doctor.whatsappNumber, 'button_clicked', { 
      buttonId: payload 
    });
    
    switch(payload) {
      case 'yes_call':
        await this.sendCalendlyLink(doctor);
        break;
      case 'no_call':
        doctor.status = 'warm_lead';
        await doctor.save();
        await whatsappService.sendTextMessage(
          doctor.whatsappNumber,
          "No problem! Feel free to message me when you're ready. 😊"
        );
        break;
      case 'roi_calc':
        await this.sendROICalculation(doctor);
        break;
      case 'cost_plan':
        await this.sendCostPlan(doctor);
        break;
      case 'schedule_call':
        await this.sendCalendlyLink(doctor);
        break;
      case 'yes_referral':
        await this.generateReferralLink(doctor);
        break;
      case 'no_referral':
        doctor.status = 'warm_lead';
        await doctor.save();
        await whatsappService.sendTextMessage(
          doctor.whatsappNumber,
          "No problem! Feel free to message me when you're ready. 😊\n\n_Type 'menu' to see main menu._"
        );
        break;
      case 'yes_demo':
        await this.sendCalendlyLink(doctor);
        break;
      case 'no_demo':
        doctor.status = 'warm_lead';
        await doctor.save();
        await whatsappService.sendTextMessage(
          doctor.whatsappNumber,
          "That's fine! The video is quite informative.\n\nIf you need a live demo later, feel free to let me know! 😊\n\n_Main menu: Type 'menu'_"
        );
        break;
    }
  }
  
  // OPTION 1: Online Doctor
  async handleOnlineDoctor(doctor) {
    doctor.currentStage = 'online_doctor';
    await doctor.save();
    
    const message = `🎥 *Dr. ${doctor.name}, here's what you need:*

*Onboarding Video (2 min):*
${process.env.ONBOARDING_VIDEO_URL || 'https://youtu.be/example'}

After watching the video, please register below:

👉 *Registration Link:*
${process.env.REGISTRATION_URL || 'https://angill.pk/doctor-register'}

_After registration, our team will activate your profile within 24 hours._

*Would you like to schedule a 5-minute orientation call?*`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
    
    // Send Yes/No buttons
    setTimeout(async () => {
      await whatsappService.sendButtonMessage(
        doctor.whatsappNumber,
        "Schedule orientation call?",
        [
          { id: 'yes_call', title: '✅ Yes, Book Call' },
          { id: 'no_call', title: '❌ No, Later' }
        ]
      );
    }, 2000);
  }
  
  // OPTION 2: Cyber Clinic
  async handleCyberClinic(doctor) {
    doctor.currentStage = 'cyber_clinic';
    await doctor.save();
    
    const message = `🏥 *Cyber Clinic - Dr. ${doctor.name}*

*A Cyber Clinic helps you:*
✔ Increase daily consultations
✔ Use Smart Calendar (Patent Pending)
✔ Double booking capacity
✔ Offer online + walk-in patients
✔ Earn higher monthly income

📄 *Cyber Clinic Brochure (PDF):*
_Sending document..._`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
    
    // Send PDF
    setTimeout(async () => {
      await whatsappService.sendDocument(
        doctor.whatsappNumber,
        process.env.CYBER_CLINIC_PDF_URL || 'https://example.com/brochure.pdf',
        'Angill Cyber Clinic Brochure',
        'Cyber_Clinic_Brochure.pdf'
      );
      
      doctor.pdfDownloaded = true;
      await doctor.save();
      await this.trackInteraction(doctor._id, doctor.whatsappNumber, 'pdf_downloaded', {});
    }, 1500);
    
    // Send options
    setTimeout(async () => {
      await whatsappService.sendButtonMessage(
        doctor.whatsappNumber,
        "What would you like to see?",
        [
          { id: 'roi_calc', title: '💰 ROI Calculation' },
          { id: 'cost_plan', title: '💳 Cost & Installment' },
          { id: 'schedule_call', title: '📞 Schedule Call' }
        ]
      );
    }, 3000);
  }
  
  // OPTION 3: Referral Program
  async handleReferral(doctor) {
    doctor.currentStage = 'referral';
    await doctor.save();
    
    const message = `💰 *Referral Program - Dr. ${doctor.name}*

*Our referral program offers attractive earnings:*

🔹 Earn *Rs. 7,500 instantly*
🔹 Another *Rs. 7,500* after contract maturity
🔹 *No limit* — earn from multiple referrals

*Would you like to generate your unique referral link?*`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
    
    setTimeout(async () => {
      await whatsappService.sendButtonMessage(
        doctor.whatsappNumber,
        "Generate your referral link?",
        [
          { id: 'yes_referral', title: '✅ Yes, Generate' },
          { id: 'no_referral', title: '❌ Not Now' }
        ]
      );
    }, 2000);
  }
  
  // OPTION 4: Smart Calendar
  async handleSmartCalendar(doctor) {
    doctor.currentStage = 'smart_calendar';
    await doctor.save();
    
    const message = `📅 *Smart Calendar - Dr. ${doctor.name}*

*Our patent-pending Dual Slot Calendar:*
✔ Doubles your appointment capacity
✔ Syncs clinic + online slots
✔ Auto-closes one when the other is booked
✔ Increases profitability by ~25%

🎥 *Watch Demo:*
${process.env.SMART_CALENDAR_DEMO_URL || 'https://youtu.be/demo'}

*Would you like a live demo?*`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
    
    setTimeout(async () => {
      await whatsappService.sendButtonMessage(
        doctor.whatsappNumber,
        "Schedule live demo?",
        [
          { id: 'yes_demo', title: '✅ Yes, Show Me' },
          { id: 'no_demo', title: '❌ Video is Enough' }
        ]
      );
    }, 2000);
  }
  
  // Send Calendly link
  async sendCalendlyLink(doctor) {
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/angill-clinic/demo';
    
    const message = `📞 *Book Your Call - Dr. ${doctor.name}*

Choose your preferred time slot:

🔗 *Calendly Link:*
${calendlyUrl}

_You'll receive a reminder before the call!_`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
    
    doctor.callBooked = true;
    doctor.status = 'warm_lead';
    await doctor.save();
    
    await this.trackInteraction(doctor._id, doctor.whatsappNumber, 'call_booked', {});
  }
  
  // Generate referral link
  async generateReferralLink(doctor) {
    // Referral code is auto-generated in Doctor model pre-save hook
    if (!doctor.referralCode) {
      await doctor.save(); // Trigger pre-save to generate code
    }
    
    doctor.linkGenerated = true;
    await doctor.save();
    
    await this.trackInteraction(doctor._id, doctor.whatsappNumber, 'referral_generated', {});
    
    const message = `🎉 *Congratulations Dr. ${doctor.name}!*

Your unique referral link is ready:

🔗 *Your Referral Link:*
${doctor.referralLink}

*How it works:*
1️⃣ Share this link with your doctor friends
2️⃣ When they register via your link
3️⃣ You earn *Rs. 7,500 instantly*
4️⃣ Another *Rs. 7,500* after 6 months

*Referral Code:* \`${doctor.referralCode}\`

_Share and earn! 💰_`;
    
    await whatsappService.sendTextMessage(doctor.whatsappNumber, message);
  }
  
  // Send ROI calculation
  async sendROICalculation(doctor) {
    await whatsappService.sendDocument(
      doctor.whatsappNumber,
      process.env.ROI_PDF_URL || 'https://example.com/roi.pdf',
      'ROI Calculation for Cyber Clinic',
      'ROI_Calculation.pdf'
    );
  }
  
  // Send cost plan
  async sendCostPlan(doctor) {
    await whatsappService.sendDocument(
      doctor.whatsappNumber,
      process.env.COST_PLAN_PDF_URL || 'https://example.com/cost.pdf',
      'Cost & Installment Plan',
      'Cost_Plan.pdf'
    );
  }
  
  // Handle menu keywords
  async handleMenuKeyword(doctor, text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('menu') || lowerText === 'back') {
      await this.sendMainMenu(doctor.whatsappNumber);
    } else {
      await whatsappService.sendTextMessage(
        doctor.whatsappNumber,
        'Please select from the menu options or type "menu".'
      );
    }
  }
  
  // Handle general messages
  async handleGeneralMessage(doctor, text) {
    await whatsappService.sendTextMessage(
      doctor.whatsappNumber,
      `How else can I help you?\n\n_Type "menu" for main menu._`
    );
  }
  
  // Track interaction
  async trackInteraction(doctorId, phoneNumber, type, details) {
    try {
      const interaction = new Interaction({
        doctorId,
        whatsappNumber: phoneNumber,
        type,
        details
      });
      await interaction.save();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
  
  // Save conversation
  async saveConversation(doctorId, phoneNumber, messageId, timestamp, type, content, messageType) {
    try {
      let conversation = await Conversation.findOne({ doctorId });
      
      if (!conversation) {
        conversation = new Conversation({
          doctorId,
          whatsappNumber: phoneNumber,
          messages: []
        });
      }
      
      conversation.messages.push({
        messageId,
        timestamp,
        type,
        content,
        messageType
      });
      
      await conversation.save();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
}

module.exports = new MessageController();