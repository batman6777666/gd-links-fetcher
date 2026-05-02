const fs = require('fs');
const path = require('path');

/**
 * Keep Alive Script for Hugging Face Spaces
 * Prevents the space from going into pause mode by maintaining continuous activity
 */

console.log('🚀 Starting Keep Alive process for Hugging Face Space...');
console.log('📝 This will maintain continuous terminal activity to prevent pausing');

let counter = 0;
const startTime = Date.now();

function formatUptime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function logActivity() {
  counter++;
  const uptime = formatUptime();
  const timestamp = new Date().toISOString();
  
  const messages = [
    `✅ [${timestamp}] Keep alive active - Count: ${counter} - Uptime: ${uptime}`,
    `📊 System time: ${new Date().toLocaleString()} - Process ID: ${process.pid}`,
    `🌐 Hugging Face Space activity maintained - ${counter} cycles completed`,
    `💻 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    `⏰ Next activity check in 30 seconds...`,
    `🔧 Maintaining backend service availability`,
    `📈 Active connections: ${counter} - Uptime: ${uptime}`,
    `🔄 Continuous logging to prevent space suspension`
  ];
  
  // Rotate through different messages
  const message = messages[counter % messages.length];
  
  console.log(message);
  
  // Also write to a log file for additional activity
  fs.appendFileSync(
    path.join(__dirname, 'space_activity.log'), 
    `${timestamp} - ${message}\n`
  );
  
  // Schedule next log
  setTimeout(logActivity, 30000); // 30 seconds interval
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down Keep Alive process gracefully...');
  console.log('📊 Final count:', counter, '- Total uptime:', formatUptime());
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down Keep Alive process gracefully...');
  console.log('📊 Final count:', counter, '- Total uptime:', formatUptime());
  process.exit(0);
});

// Start the logging process
console.log('⏰ Starting continuous activity logging (30 second intervals)...');
console.log('💡 This process will prevent Hugging Face Space from pausing due to inactivity');
console.log('🛑 Press Ctrl+C or send SIGINT/SIGTERM to stop this process');

logActivity();