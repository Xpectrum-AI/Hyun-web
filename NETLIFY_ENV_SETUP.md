# Netlify Environment Variables Setup

## Required Environment Variables for Netlify

To enable voice functionality on Netlify, you need to set the following environment variables in your Netlify dashboard:

### 1. Go to Netlify Dashboard
1. Navigate to your site in Netlify dashboard
2. Go to **Site settings** → **Environment variables**
3. Add the following variables:

### 2. Required Variables

```
VITE_VOICE_API_KEY=xpectrum-ai@123
VOICE_API_KEY=xpectrum-ai@123
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
```

### 3. Optional Variables (for chat functionality)
```
DIFY_API_KEY=app-qXbGcG3BX32wyKAIQP9Vlnol
DIFY_API_BASE_URL=https://demos.xpectrum-ai.com/v1
```

## How to Set Environment Variables in Netlify

1. **Via Netlify Dashboard:**
   - Go to your site dashboard
   - Click on "Site settings"
   - Click on "Environment variables" in the left sidebar
   - Click "Add variable"
   - Enter the variable name and value
   - Click "Save"

2. **Via Netlify CLI:**
   ```bash
   netlify env:set VITE_VOICE_API_KEY "xpectrum-ai@123"
   netlify env:set VOICE_API_KEY "xpectrum-ai@123"
   netlify env:set VOICE_API_BASE_URL "https://d3sgivh2kmd3c8.cloudfront.net"
   ```

## Testing the Setup

After setting the environment variables:

1. **Redeploy your site** (trigger a new deployment)
2. **Test the voice functionality:**
   - Open your deployed site
   - Click the "VOICE CALL" button
   - Check browser console for any errors
   - The function should now return real tokens instead of mock ones

## Troubleshooting

### If you still get 404 errors:
1. Check that the environment variables are set correctly
2. Verify the function is deployed: `/.netlify/functions/voice-integration`
3. Check Netlify function logs in the dashboard

### If you get mock responses:
- The environment variables are not set or not accessible
- Check that the variables are set for the correct environment (production)

### If voice calls don't work:
1. Check browser console for errors
2. Verify microphone permissions are granted
3. Check that the LiveKit URL is accessible
4. Verify the API credentials are correct

## Current Function Status

- ✅ **voice-integration.js** - Simple mock function (works without env vars)
- ✅ **voice-integration-v2.js** - Full function with real API calls (requires env vars)
- ✅ **netlify.toml** - Updated to use correct function path
- ✅ **VoiceChatWidget.tsx** - Fixed API key reference and function path
