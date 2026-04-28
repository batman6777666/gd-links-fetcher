// Ping script to keep Hugging Face Space awake
// Run this script continuously to prevent the space from sleeping

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'https://gdfetcher789-gdfetcher.hf.space';
const PING_INTERVAL = process.env.PING_INTERVAL || 240000; // 4 minutes (Hugging Face sleeps after ~5 min of inactivity)
const PING_ENDPOINT = '/ping';

let pingCount = 0;
let errorCount = 0;

async function pingSpace() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${HF_SPACE_URL}${PING_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      pingCount++;
      console.log(`[${new Date().toISOString()}] ✅ Ping #${pingCount} - Status: ${data.status} - Response: ${duration}ms - Uptime: ${Math.floor(data.uptime / 60)}min`);
      errorCount = 0; // Reset error count on success
    } else {
      errorCount++;
      console.log(`[${new Date().toISOString()}] ⚠️  Ping failed - Status: ${response.status} - Errors in a row: ${errorCount}`);
    }
  } catch (error) {
    errorCount++;
    console.log(`[${new Date().toISOString()}] ❌ Ping error: ${error.message} - Errors in a row: ${errorCount}`);
    
    // If too many consecutive errors, the space might be asleep
    if (errorCount >= 3) {
      console.log(`[${new Date().toISOString()}] 💤 Space might be asleep. Attempting to wake it up...`);
      // Try to hit the main endpoint to trigger wake-up
      try {
        await fetch(HF_SPACE_URL, { method: 'GET' });
        console.log(`[${new Date().toISOString()}] 🔄 Wake-up request sent`);
      } catch (wakeError) {
        console.log(`[${new Date().toISOString()}] ⚠️  Wake-up request also failed: ${wakeError.message}`);
      }
    }
  }
}

// Start pinging
console.log('\n========================================');
console.log('  HF SPACE PING KEEPER');
console.log('========================================');
console.log(`  Target URL:  ${HF_SPACE_URL}`);
console.log(`  Ping every:  ${PING_INTERVAL / 1000}s`);
console.log(`  Endpoint:    ${PING_ENDPOINT}`);
console.log('========================================\n');

// Initial ping
pingSpace();

// Set up interval
setInterval(pingSpace, PING_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\nPing Keeper stopped. Total pings: ${pingCount}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n\nPing Keeper stopped. Total pings: ${pingCount}`);
  process.exit(0);
});
