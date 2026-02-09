const cron = require('node-cron');
const followUpService = require('../services/followUpService');

class CronJobs {
  
  // Initialize all cron jobs
  init() {
    console.log('🕐 Initializing cron jobs...');
    
    // Follow-up automation - runs every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running follow-up cron job...');
      await followUpService.processFollowUps();
    });
    
    // Daily stats report - runs at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('📊 Running daily stats...');
      // TODO: Implement stats collection
    });
    
    // Weekly cleanup - runs every Sunday at midnight
    cron.schedule('0 0 * * 0', async () => {
      console.log('🧹 Running weekly cleanup...');
      // TODO: Archive old conversations
    });
    
    console.log('✅ All cron jobs initialized');
  }
  
  // Stop all cron jobs
  stop() {
    cron.getTasks().forEach(task => task.stop());
    console.log('⏹️ All cron jobs stopped');
  }
}

module.exports = new CronJobs();