# GD Links Fetcher

<div align="center">

<h1>🔗 GD Links Fetcher 🚀</h1>

<p><strong>✨ A magical tool that transforms driveseed links into direct downloads ✨</strong></p>

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />

</div>

---

## 🎯 What It Does

🐹 Paste your **driveseed.org** links and watch the hamster wheel spin while we fetch your direct download links at **lightning speed ⚡**

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 🎨 Frontend | React + Tailwind | Beautiful UI with dark/light mode |
| ⚙️ Backend | Node.js + Express | Fast API server |
| 🌐 Parsing | Regex + Fetch | Super fast HTML extraction |
| 🎭 Browser | Puppeteer | Headless Chrome automation |
| 💾 Storage | LocalStorage | Your history stays private |

---

## 🚀 Quick Start

### 📦 Step 1: Install Everything

```bash
npm run install:all
```

### 🏃 Step 2: Start the Magic

```bash
npm run dev
```

✅ Backend runs on **http://localhost:3001**
✅ Frontend runs on **http://localhost:5173**

### 🎮 Step 3: Use It

1. 🌐 Open **http://localhost:5173**
2. 📋 Paste your **driveseed.org** links (one per line)
3. 🐹 Click **FETCH LINKS** and watch the hamster run!
4. 📥 Copy your direct download links

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚀 **Blazing Fast** | 15 links processed in parallel |
| 🗂️ **Batch Magic** | Handle 500+ links without breaking a sweat |
| 🏆 **Smart Priority** | Auto-picks V2 links over regular ones |
| 🎨 **Dual Themes** | Dark mode + Light mode toggle |
| 📚 **History** | All your fetched links saved locally |
| 💨 **Speed Mode** | No images, no CSS, pure speed |
| 🔄 **Smart Cache** | Repeat links load instantly |
| 📊 **Live Metrics** | See links per second in real-time |
| 🐹 **Cute Loader** | Running hamster animation |
| 📋 **One-Click Copy** | Copy all successful links at once |

---

## 🗂️ Project Structure

```
📁 gd-links-fetcher/
├── 📁 backend/
│   ├── 📄 server.js                 🏃 Entry point
│   ├── 📁 routes/
│   │   └── 📄 fetch.js             🛣️ API routes
│   ├── 📁 controllers/
│   │   └── 📄 linkController.js    🧠 Brain of the operation
│   └── 📁 utils/
│       ├── 📄 driveseedParser.js   ⚡ Fast regex parser
│       └── 📄 finalLinkExtractor.js 🎭 Puppeteer magic
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📄 App.jsx              🎨 Main component
│   │   ├── 📁 components/
│   │   │   └── 📄 Loader.jsx       🐹 Hamster wheel
│   │   └── 📄 index.css            🎨 Styles
│   └── 📄 index.html
│
└── 📄 package.json                📦 Dependencies
```

---

## 🔌 API Endpoint

### POST `/api/fetch-links`

**📤 Request:**
```json
{
  "links": [
    "https://driveseed.org/file/abc123",
    "https://driveseed.org/file/xyz456"
  ]
}
```

**📥 Response:**
```json
{
  "results": [
    {
      "originalLink": "https://driveseed.org/file/abc123",
      "finalLink": "https://video-downloads...",
      "status": "success",
      "duration": 2450
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

---

## ⚙️ Requirements

- ✅ Node.js **16+**
- ✅ Chrome/Chromium (auto-downloaded by Puppeteer)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 🔴 Backend won't start | Check port **3001** is free |
| 🎭 Puppeteer errors | Run `cd backend && npm install` |
| 🐧 Linux issues | `sudo apt-get install -y libgbm-dev` |
| 🌐 CORS errors | Already enabled for development |

---

## 💝 Made With Love

Built for speed. Designed for cuteness. Powered by hamsters. 🐹

---

<div align="center">

**🌟 Star this repo if you found it helpful! 🌟**

Made with 💙 and ☕

</div>
