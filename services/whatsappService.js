const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v21.0';
    this.phoneNumberId = process.env.PHONE_NUMBER_ID;
    this.accessToken = process.env.META_ACCESS_TOKEN;
  }

  // Send text message with formatting
  async sendTextMessage(to, text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { 
            body: text,
            preview_url: true // Enable link preview
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send interactive button message (max 3 buttons)
  async sendButtonMessage(to, bodyText, buttons, headerText = null) {
    try {
      const interactiveBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.slice(0, 3).map((btn) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 20)
              }
            }))
          }
        }
      };

      // Add header if provided
      if (headerText) {
        interactiveBody.interactive.header = {
          type: 'text',
          text: headerText
        };
      }

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        interactiveBody,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Button message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending button message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send list message (for more than 3 options)
  async sendListMessage(to, bodyText, buttonText, sections) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: bodyText },
            action: {
              button: buttonText,
              sections: sections
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ List message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending list message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send document (PDF)
  async sendDocument(to, documentUrl, caption = '', filename = 'document.pdf') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'document',
          document: {
            link: documentUrl,
            caption: caption,
            filename: filename
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Document sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending document:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send image
  async sendImage(to, imageUrl, caption = '') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Image sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending image:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send video
  async sendVideo(to, videoUrl, caption = '') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'video',
          video: {
            link: videoUrl,
            caption: caption
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Video sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending video:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send template message (for follow-ups outside 24hr window)
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Template message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('Error sending template:', error.response?.data || error.message);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error marking as read:', error.message);
    }
  }
}

module.exports = new WhatsAppService();