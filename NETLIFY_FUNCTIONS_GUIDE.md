# Netlify Functions Deployment Guide

## Overview
This guide explains the Netlify Functions setup for the Hyun website, including voice integration and chatbot functionality.

## Available Functions

### 1. Health Check Function
- **File**: `netlify/functions/health-check.js`
- **URL**: `/.netlify/functions/health-check` or `/health`
- **Purpose**: Simple health check with no external dependencies
- **Dependencies**: None (uses only built-in Node.js modules)

### 2. Voice Integration V2
- **File**: `netlify/functions/voice-integration-v2.js`
- **URL**: `/.netlify/functions/voice-integration-v2` or `/voice/*`
- **Purpose**: Voice call token generation and agent joining
- **Dependencies**: None (uses only built-in Node.js modules)
- **Endpoints**:
  - `/tokens/generate?agent_name=hyun`
  - `/agents/join`

### 3. Chatbot Proxy
- **File**: `netlify/functions/chatbot-proxy.js`
- **URL**: `/.netlify/functions/chatbot-proxy` or `/chat`
- **Purpose**: Proxy for Dify AI chatbot API calls
- **Dependencies**: None (uses only built-in Node.js modules)
- **Endpoints**:
  - `POST /chat` - Chatbot API proxy

## Environment Variables Required

Set these in your Netlify dashboard under Site Settings → Environment Variables:

```
VOICE_API_KEY=xpectrum-ai@123
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
VITE_VOICE_API_KEY=xpectrum-ai@123
DIFY_API_BASE_URL=https://demos.xpectrum-ai.com/v1
DIFY_API_KEY=app-qXbGcG3BX32wyKAIQP9Vlnol
```

## Testing Functions

### Health Check
```bash
curl https://your-site.netlify.app/health
```

### Voice Integration
```bash
curl "https://your-site.netlify.app/voice/tokens/generate?agent_name=hyun"
```

## Build Configuration

The `netlify.toml` file includes:
- Node.js 18 environment
- Functions install plugin
- External node modules configuration
- Proper redirects for all endpoints

## Troubleshooting

### Build Failures
1. **Missing Dependencies**: Ensure all packages are in `package.json`
2. **External Modules**: Check `external_node_modules` in `netlify.toml`
3. **Node Version**: Verify Node.js 18 is specified

### Function Errors
1. **Environment Variables**: Check all required variables are set
2. **API Endpoints**: Verify backend URLs are accessible
3. **CORS Issues**: Check function headers include proper CORS

### Testing
1. Use `/health` endpoint to verify functions are working
2. Check Netlify Functions tab in dashboard for logs
3. Monitor browser console for frontend errors

## Deployment Steps

1. **Set Environment Variables** in Netlify dashboard
2. **Deploy from GitHub** - Netlify will automatically build
3. **Test Functions** using the health check endpoint
4. **Verify Voice Calls** work on the deployed site
5. **Check Chatbot** functionality

## File Structure

```
netlify/
├── functions/
│   ├── health-check.js          # No dependencies
│   ├── voice-integration-v2.js  # No dependencies
│   ├── voice-integration.js     # With node-fetch
│   ├── test-voice.js           # With node-fetch
│   ├── voice-integration-simple.js # Backup
│   └── package.json            # Function dependencies
├── netlify.toml                # Build configuration
└── NETLIFY_FUNCTIONS_GUIDE.md  # This file
```

## Success Indicators

✅ **Build Success**: No errors in Netlify build logs  
✅ **Health Check**: `/health` returns JSON response  
✅ **Voice Calls**: Voice button works on deployed site  
✅ **Chatbot**: Chat interface responds properly  
✅ **Environment**: All variables loaded correctly
