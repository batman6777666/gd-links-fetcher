# GD Links Fetcher API

Fast API server for extracting direct download links from driveseed.org

## 🚀 Features

- ⚡ Blazing fast link extraction
- 🔄 Batch processing (15 links in parallel)
- 💾 Smart caching
- 🎭 Puppeteer-powered browser automation

## 🔌 API Endpoint

### POST `/api/fetch-links`

Extract direct download links from driveseed.org URLs.

**Request:**
```json
{
  "links": [
    "https://driveseed.org/file/abc123",
    "https://driveseed.org/file/xyz456"
  ]
}
```

**Response:**
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
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

## 🛠️ Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:7860`

## 🐳 Docker

```bash
docker build -t gd-links-api .
docker run -p 7860:7860 gd-links-api
```

## 📡 Deployed URL

API is available at the Hugging Face Space URL
