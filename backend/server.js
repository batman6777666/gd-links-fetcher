const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const fetchRoutes = require('./routes/fetch');

// Helper to find Chrome/Chromium executable
function findChromeExecutable() {
  // 1. Check environment variable first
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    console.log(`[BROWSER] Using env path: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  
  // 2. Try system Chromium paths
  const systemPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable'
  ];
  
  for (const chromePath of systemPaths) {
    if (fs.existsSync(chromePath)) {
      console.log(`[BROWSER] Found system Chromium at: ${chromePath}`);
      return chromePath;
    }
  }
  
  // 3. Try Puppeteer's default
  try {
    const defaultPath = puppeteer.executablePath();
    if (fs.existsSync(defaultPath)) {
      console.log(`[BROWSER] Found Puppeteer Chrome at: ${defaultPath}`);
      return defaultPath;
    }
  } catch (e) {
    // Continue to search
  }
  
  // 4. Search in cache locations
  const searchPaths = [
    '/app/.cache/puppeteer/chrome',
    '/home/pptruser/.cache/puppeteer/chrome',
    '/root/.cache/puppeteer/chrome'
  ];
  
  for (const basePath of searchPaths) {
    if (fs.existsSync(basePath)) {
      const entries = fs.readdirSync(basePath);
      for (const entry of entries) {
        const chromePath = path.join(basePath, entry, 'chrome-linux64', 'chrome');
        if (fs.existsSync(chromePath)) {
          console.log(`[BROWSER] Found cached Chrome at: ${chromePath}`);
          return chromePath;
        }
      }
    }
  }
  
  return null;
}

const app = express();
const PORT = process.env.PORT || 7860; // Hugging Face default port

// Middleware - Allow all origins for Hugging Face
const allowedOrigins = [
  'https://gd-links-fetcher.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.log(`[CORS] Blocked origin: ${origin}`);
      callback(null, true); // Allow all for now
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle OPTIONS preflight for all routes
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.status(200).end();
});

app.use(express.json());

// Global browser instance
let browser = null;
let browserLaunchAttempts = 0;
const MAX_BROWSER_RETRIES = 3;

async function launchBrowser() {
  try {
    browserLaunchAttempts++;
    console.log(`[BROWSER] Launch attempt #${browserLaunchAttempts}`);

    // Find Chrome executable path dynamically
    const executablePath = findChromeExecutable();

    if (!executablePath) {
      console.error('[BROWSER] Chrome/Chromium executable not found!');
      throw new Error('Chrome executable not found');
    }

    console.log(`[BROWSER] Launching Chrome from: ${executablePath}`);

    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-images',
        '--disable-css-animations',
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
        '--single-process',
        '--memory-saving-mode'
      ]
    });

    console.log('[BROWSER] Puppeteer launched successfully');
    browserLaunchAttempts = 0; // Reset counter on success

    // Monitor browser for disconnect/crash and auto-restart
    browser.on('disconnected', () => {
      console.log('[BROWSER] Browser disconnected/crashed. Will auto-restart...');
      browser = null;
      setTimeout(launchBrowser, 5000); // Retry in 5 seconds
    });

  } catch (error) {
    console.error('[BROWSER] Failed to launch Puppeteer:', error.message);
    browser = null;

    // Auto-retry if under max attempts
    if (browserLaunchAttempts < MAX_BROWSER_RETRIES) {
      console.log(`[BROWSER] Retrying in 10 seconds... (attempt ${browserLaunchAttempts}/${MAX_BROWSER_RETRIES})`);
      setTimeout(launchBrowser, 10000);
    } else {
      console.log('[BROWSER] Max retries reached. Browser will stay offline but server continues.');
      console.log('[BROWSER] The /ping endpoint still works. Links can\'t be fetched until browser restarts.');
    }
  }
}

// Check if browser is healthy, if not try to restart
async function ensureBrowser() {
  if (!browser) {
    console.log('[BROWSER] Browser not available, attempting to launch...');
    browserLaunchAttempts = 0; // Reset to allow retry
    await launchBrowser();
  }
  return browser;
}

// Make browser available to routes - auto-restart if needed
app.use(async (req, res, next) => {
  // For API routes, ensure browser is ready
  if (req.path.startsWith('/api')) {
    req.browser = await ensureBrowser();
  } else {
    req.browser = browser;
  }
  next();
});

// Routes
app.use('/api', fetchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', browserReady: browser !== null });
});

// Ping endpoint for keep-alive - works even if browser isn't ready
app.get('/ping', (req, res) => {
  res.json({
    status: 'alive',
    browserReady: browser !== null,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Wake-up endpoint - lightweight, just returns 200
app.get('/', (req, res) => {
  res.json({
    status: 'GD Links Fetcher is running',
    endpoints: ['/ping', '/health', '/api/fetch-links']
  });
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

// Start server - BROWSER IS OPTIONAL, server starts regardless
async function startServer() {
  // Start server FIRST (before browser) so /ping works immediately
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  GD LINKS FETCHER BACKEND');
    console.log('========================================');
    console.log(`  Server running on: http://0.0.0.0:${PORT}`);
    console.log(`  Health check:      http://0.0.0.0:${PORT}/health`);
    console.log(`  Ping endpoint:     http://0.0.0.0:${PORT}/ping`);
    console.log(`  API Endpoint:      http://0.0.0.0:${PORT}/api/fetch-links`);
    console.log('========================================\n');
  });

  // Launch browser in background - if it fails, server keeps running
  // /ping will still work, API just won't process links until browser is ready
  launchBrowser().catch(err => {
    console.error('[BROWSER] Failed to launch, but server continues running.');
    console.error('[BROWSER] Error:', err.message);
    console.log('[BROWSER] The /ping endpoint will still work. Browser will retry on next API call.');
  });

  // Self-ping mechanism to keep the Space alive
  // Hugging Face pauses free Spaces after ~5 minutes of inactivity
  const SELF_PING_INTERVAL = 3 * 60 * 1000; // 3 minutes

  function selfPing() {
    const pingUrl = `http://0.0.0.0:${PORT}/ping`;
    http.get(pingUrl, (res) => {
      console.log(`[SELF-PING] Status: ${res.statusCode} at ${new Date().toISOString()}`);
    }).on('error', (err) => {
      console.log(`[SELF-PING] Error: ${err.message}`);
    });
  }

  // Start self-ping after server is ready
  setTimeout(() => {
    console.log('[KEEP-ALIVE] Starting self-ping mechanism...');
    setInterval(selfPing, SELF_PING_INTERVAL);
  }, 5000);

  return server;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received - Shutting down gracefully...');
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received - Hugging Face is pausing the Space. This is normal for free tier.');
  console.log('The Space will wake up on next request (takes 30-60 seconds).');
  console.log('To prevent this, ensure GitHub Actions ping is working correctly.');
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});

// Prevent crashes from unhandled errors - SERVER MUST NEVER DIE
process.on('uncaughtException', (err) => {
  console.error('[CRASH PROTECTION] Uncaught Exception:', err.message);
  console.error('[CRASH PROTECTION] Stack:', err.stack);
  console.log('[CRASH PROTECTION] Server will continue running...');
  // NEVER exit - keep the server alive at all costs
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH PROTECTION] Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('[CRASH PROTECTION] Server will continue running...');
  // NEVER exit - keep the server alive at all costs
});

// Catch everything else
process.on('warning', (warning) => {
  console.warn('[WARNING]', warning.name, warning.message);
});

startServer();
