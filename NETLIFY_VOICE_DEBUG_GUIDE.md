# Netlify Voice Integration Debug Guide

## Issue Identified
The voice call functionality is not working on Netlify deployment because:

1. **Environment Variables Missing**: The Netlify Functions need environment variables to be set in Netlify's dashboard
2. **Function Name Mismatch**: The frontend is trying to access `voice-integration` but the function is `voice-integration-v2`

## Steps to Fix

### 1. Set Environment Variables in Netlify

Go to your Netlify dashboard and set these environment variables:

```
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
VOICE_API_KEY=xpectrum-ai@123
DIFY_API_BASE_URL=https://demos.xpectrum-ai.com/v1
DIFY_API_KEY=app-qXbGcG3BX32wyKAIQP9Vlnol
```

**How to set environment variables in Netlify:**
1. Go to your Netlify dashboard
2. Select your site (hyun-website)
3. Go to Site settings > Environment variables
4. Add each variable above

### 2. Test the Functions

After setting environment variables, test these URLs:

- **Debug Function**: https://hyun-website.netlify.app/debug-voice
- **Health Check**: https://hyun-website.netlify.app/health
- **Voice Function**: https://hyun-website.netlify.app/.netlify/functions/voice-integration-v2

### 3. Clear Browser Cache

The frontend might be using cached JavaScript. Try:
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Open in incognito/private mode
- Clear browser cache

### 4. Verify Deployment

Check that the latest code is deployed:
- Go to Netlify dashboard > Deploys
- Ensure the latest commit is deployed
- Check for any build errors

## Expected Behavior After Fix

1. **Debug Function** should return environment variable status
2. **Voice Function** should return proper tokens
3. **Voice calls** should connect to the agent

## Current Status

✅ **Working**: Local development (localhost:3001)
❌ **Not Working**: Netlify deployment (missing environment variables)

## Next Steps

1. Set environment variables in Netlify dashboard
2. Wait for deployment to complete
3. Test voice functionality
4. If still not working, check Netlify function logs
