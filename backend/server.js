const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
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

async function launchBrowser() {
  try {
    // Find Chrome executable path dynamically
    const executablePath = findChromeExecutable();
    
    if (!executablePath) {
      console.error('[BROWSER] Chrome/Chromium executable not found!');
      console.error('[BROWSER] Searched for:');
      console.error('  - /usr/bin/chromium');
      console.error('  - /usr/bin/chromium-browser');
      console.error('  - /usr/bin/google-chrome');
      console.error('  - /usr/bin/google-chrome-stable');
      console.error('  - Puppeteer default path');
      console.error('  - Cache directories');
      process.exit(1);
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

// Ping endpoint for keep-alive (lightweight, no heavy operations)
app.get('/ping', (req, res) => {
  res.json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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

// Start server
async function startServer() {
  await launchBrowser();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  GD LINKS FETCHER BACKEND');
    console.log('========================================');
    console.log(`  Server running on: http://0.0.0.0:${PORT}`);
    console.log(`  Health check:      http://0.0.0.0:${PORT}/health`);
    console.log(`  API Endpoint:      http://0.0.0.0:${PORT}/api/fetch-links`);
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
