const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fetchRoutes = require('./routes/fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global browser instance
let browser = null;

async function launchBrowser() {
  try {
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode for better performance
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-images', // Don't load images
        '--disable-css-animations', // Disable CSS animations
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--single-process', // Run in single process mode for speed
        '--memory-saving-mode'
      ]
    });
    console.log('[BROWSER] Puppeteer launched in high-performance mode');
  } catch (error) {
    console.error('Failed to launch Puppeteer browser:', error.message);
    process.exit(1);
  }
}

// Make browser available to routes
app.use((req, res, next) => {
  req.browser = browser;
  next();
});

// Routes
app.use('/api', fetchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', browserReady: browser !== null });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('=== SERVER ERROR ===');
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  console.error('===================');
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
async function startServer() {
  await launchBrowser();
  
  app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  GD LINKS FETCHER BACKEND');
    console.log('========================================');
    console.log(`  Server running on: http://localhost:${PORT}`);
    console.log(`  Health check:      http://localhost:${PORT}/health`);
    console.log('========================================\n');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});

startServer();
