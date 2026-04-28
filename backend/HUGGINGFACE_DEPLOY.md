# 🚀 Deploy to Hugging Face Spaces

## 📁 Files Created for Hugging Face

- **Dockerfile** - Complete Docker setup with Puppeteer dependencies
- **README.md** - Hugging Face Space documentation
- **.dockerignore** - Excludes unnecessary files from Docker build
- **.gitattributes** - Ensures proper line endings

## 🛠️ Deployment Steps

### 1. Create Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click **Create new Space**
3. Select **Docker** as SDK
4. Choose **Blank** or **Node.js** template
5. Set Space name (e.g., `gd-links-fetcher`)
6. Set visibility (Public/Private)
7. Click **Create Space**

### 2. Upload Files

Upload these files to your Space:
```
backend/
├── Dockerfile
├── README.md
├── .dockerignore
├── .gitattributes
├── server.js
├── package.json
├── routes/
│   └── fetch.js
├── controllers/
│   └── linkController.js
└── utils/
    ├── driveseedParser.js
    └── finalLinkExtractor.js
```

### 3. Environment Variables (Optional)

If needed, add in Space Settings:
- `PORT=7860` (already set in Dockerfile)

### 4. Wait for Build

Hugging Face will automatically:
1. Build the Docker image
2. Install Chrome dependencies
3. Install Node.js dependencies
4. Start the server on port 7860

### 5. Test Your API

Once deployed, test with:
```bash
curl -X POST https://gd567898765-gd1.hf.space/api/fetch-links \
  -H "Content-Type: application/json" \
  -d '{"links":["https://driveseed.org/file/abc123"]}'
```

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fetch-links` | POST | Extract direct download links |
| `/health` | GET | Health check |

## 📋 Request Format

```json
{
  "links": [
    "https://driveseed.org/file/abc123",
    "https://driveseed.org/file/xyz456"
  ]
}
```

## 📋 Response Format

```json
{
  "results": [
    {
      "originalLink": "https://driveseed.org/file/abc123",
      "finalLink": "https://video-downloads.googleusercontent.com/...",
      "status": "success",
      "duration": 2450
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

## ⚙️ Configuration Details

- **Port:** 7860 (Hugging Face default)
- **CORS:** Enabled for all origins
- **Puppeteer:** Runs with Chrome in container
- **User:** Non-root user (pptruser) for security

## 🐛 Troubleshooting

**Build fails:**
- Check Dockerfile has all Chrome dependencies
- Ensure package.json includes all dependencies

**Puppeteer fails:**
- Container has all required system libraries
- Using `--no-sandbox` flag for Docker compatibility

**CORS errors:**
- CORS is configured to allow all origins (`*`)
- Check frontend is using correct API URL

## 🔗 Connecting Frontend

Update your frontend `App.jsx` API_URL:
```javascript
const API_URL = 'https://gd567898765-gd1.hf.space/api/fetch-links';
```

Or use environment variables for flexibility.

---

**Your backend is now ready for Hugging Face! 🎉**
