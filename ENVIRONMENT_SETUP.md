# Environment Variables Setup for Hyun and Associates Website

## Required Environment Variables

Create a `.env` file in the project root directory with the following variables:

```env
# Cartesia TTS Configuration
VITE_CARTESIA_API_KEY=sk_car_uDYkY7f1JYTE5eB3AKqfEV
VITE_CARTESIA_VOICE_ID=5c5ad5e7-1020-476b-8b91-fdcbe9cc313c

# Voice API Configuration
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
VOICE_API_KEY=xpectrum-ai@123

# Frontend Voice API (Vite requires VITE_ prefix)
VITE_VOICE_API_KEY=xpectrum-ai@123

# Xpectrum AI Chatbot Configuration
XPECTRUM_API_BASE_URL=https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1
XPECTRUM_API_KEY=app-WxAWGosGXvslDCmQdLg2wlHz
```

## File Structure

```
/Users/vamsikrishna/Desktop/HYUN/
├── .env                    # Create this file with the variables above
├── backend/
│   ├── index.js           # Uses XPECTRUM_API_BASE_URL and XPECTRUM_API_KEY
│   └── voice.js           # Uses VOICE_API_BASE_URL and VOICE_API_KEY
└── src/
    └── components/
        └── VoiceChatWidget.tsx  # Uses VITE_VOICE_API_KEY
```

## How to Create the .env File

1. **Navigate to the project root:**
   ```bash
   cd /Users/vamsikrishna/Desktop/HYUN
   ```

2. **Create the .env file:**
   ```bash
   touch .env
   ```

3. **Add the environment variables:**
   ```bash
   echo "VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net" >> .env
   echo "VOICE_API_KEY=xpectrum-ai@123" >> .env
   echo "VITE_VOICE_API_KEY=xpectrum-ai@123" >> .env
   echo "XPECTRUM_API_BASE_URL=https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1" >> .env
   echo "XPECTRUM_API_KEY=app-WxAWGosGXvslDCmQdLg2wlHz" >> .env
   ```

## Verification

After creating the `.env` file, restart both servers:

```bash
# Stop existing servers
pkill -f "node index.js"
pkill -f "vite"

# Start backend
cd backend && node index.js &

# Start frontend
cd .. && npm run dev -- --port 1000
```

## Testing

1. **Chatbot**: Should work with real Dify responses
2. **Voice Call**: Should connect to Pravina agent using the provided API credentials

## Troubleshooting

If you see "Missing environment variables" errors:
1. Verify the `.env` file exists in the project root
2. Check that all variables are correctly spelled
3. Restart both servers after creating the `.env` file
4. Check server logs for environment variable loading
