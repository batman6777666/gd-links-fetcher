# 🚀 Keep Hugging Face Space Awake

## Problem
Hugging Face Spaces automatically **pause/sleep** after ~5 minutes of inactivity to save resources. This causes delays when users access your app.

## Solution: Ping Keeper

A continuous ping mechanism that sends HTTP requests every 4 minutes to keep your space awake 24/7.

---

## 📋 Setup Options

### Option 1: Run Ping Keeper Locally (Recommended for Development)

Run the ping script on your computer:

```bash
cd backend
npm run ping-keeper
```

**Pros:**
- Easy to set up
- Free
- Works immediately

**Cons:**
- Your computer must stay on 24/7
- Requires internet connection

---

### Option 2: Deploy Ping Keeper to a Free Cloud Service

#### A. **Render.com** (Free Tier)
1. Create account at [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repo
4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && node ping-keeper.js`
6. Add Environment Variable: `HF_SPACE_URL=https://gdfetcher789-gd-links.hf.space`

#### B. **Railway.app** (Free Tier)
1. Create account at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Set Start Command: `node backend/ping-keeper.js`
4. Add Environment Variable: `HF_SPACE_URL=https://gdfetcher789-gd-links.hf.space`

#### C. **GitHub Actions** (Completely Free)
Create `.github/workflows/ping-keeper.yml`:

```yaml
name: HF Space Ping Keeper

on:
  schedule:
    - cron: '*/4 * * * *'  # Every 4 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping HF Space
        run: |
          curl -f https://gdfetcher789-gd-links.hf.space/ping || echo "Space woke up"
```

---

### Option 3: Use Online Cron Services

#### A. **Cron-job.org** (Free)
1. Go to [cron-job.org](https://cron-job.org)
2. Create account
3. Add new cron job:
   - URL: `https://gdfetcher789-gd-links.hf.space/ping`
   - Schedule: Every 4 minutes
   - Method: GET

#### B. **UptimeRobot** (Free)
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account
3. Add new monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: HF Space Ping
   - URL: `https://gdfetcher789-gd-links.hf.space/ping`
   - Monitoring Interval: 5 minutes

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HF_SPACE_URL` | Your Hugging Face Space URL | `https://gdfetcher789-gd-links.hf.space` |
| `PING_INTERVAL` | Time between pings (milliseconds) | `240000` (4 minutes) |

### Custom Configuration Example

```bash
# Ping every 3 minutes
set HF_SPACE_URL=https://gdfetcher789-gd-links.hf.space
set PING_INTERVAL=180000
npm run ping-keeper
```

---

## 📊 Monitoring

The ping keeper logs every request:

```
========================================
  HF SPACE PING KEEPER
========================================
  Target URL:  https://gdfetcher789-gd-links.hf.space
  Ping every:  240s
  Endpoint:    /ping
========================================

[2026-04-28T06:49:13.000Z] ✅ Ping #1 - Status: alive - Response: 245ms - Uptime: 12min
[2026-04-28T06:53:13.000Z] ✅ Ping #2 - Status: alive - Response: 198ms - Uptime: 16min
[2026-04-28T06:57:13.000Z] ✅ Ping #3 - Status: alive - Response: 210ms - Uptime: 20min
```

### Log Symbols:
- ✅ **Success** - Space is awake and responding
- ⚠️ **Warning** - Request failed (temporary issue)
- ❌ **Error** - Connection failed
- 💤 **Sleeping** - Space might be paused (auto wake-up triggered)
- 🔄 **Wake-up** - Attempting to restart the space

---

## 🎯 Hugging Face Paid Option

### Upgrade to PRO Space ($9/month)
- **Never sleeps** - runs 24/7
- Faster response times
- More CPU/RAM resources
- No need for ping keeper

**To upgrade:**
1. Go to your Hugging Face Space
2. Click "Settings"
3. Scroll to "Hardware"
4. Select "Upgrade to PRO"

---

## 🛡️ Best Practices

1. **Ping every 4 minutes** - Hugging Face sleeps after ~5 min
2. **Use `/ping` endpoint** - Lightweight, doesn't trigger heavy operations
3. **Monitor logs** - Check for consecutive errors
4. **Have backup plan** - Use multiple ping services for reliability

---

## 📝 Quick Start

### Immediate Solution (Run Now):
```bash
cd backend
npm run ping-keeper
```

Keep this terminal window open to maintain your space awake!

---

## ❓ Troubleshooting

### Space still sleeping?
- Reduce ping interval to 3 minutes: `PING_INTERVAL=180000`
- Check if your computer is sleeping/hibernating
- Verify internet connection

### Too many errors?
- The space might be rebuilding/updating
- Check Hugging Face Space logs
- Try manual wake-up: visit the space URL in browser

### High response times?
- Hugging Face free tier has limited resources
- Consider upgrading to PRO space
- Check if other requests are running simultaneously

---

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ping` | GET | Lightweight keep-alive ping |
| `/health` | GET | Health check with browser status |
| `/api/fetch-links` | POST | Main API endpoint |

---

**Your space will now stay awake 24/7! 🎉**
