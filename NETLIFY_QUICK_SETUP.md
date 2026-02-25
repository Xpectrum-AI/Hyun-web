# Quick Netlify Environment Setup

## The Issue
Your voice functionality is returning mock tokens instead of real ones because the environment variables aren't set in Netlify.

## Quick Fix (5 minutes)

### Step 1: Go to Netlify Dashboard
1. Open [netlify.com](https://netlify.com)
2. Go to your site dashboard
3. Click **"Site settings"** (gear icon)

### Step 2: Add Environment Variables
1. Click **"Environment variables"** in the left sidebar
2. Click **"Add variable"**
3. Add these 3 variables:

```
Variable name: VITE_VOICE_API_KEY
Value: xpectrum-ai@123

Variable name: VOICE_API_KEY  
Value: xpectrum-ai@123

Variable name: VOICE_API_BASE_URL
Value: https://d3sgivh2kmd3c8.cloudfront.net
```

### Step 3: Redeploy
1. Go back to your site dashboard
2. Click **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy site"**

### Step 4: Test
1. Wait for deployment to complete
2. Visit your site
3. Click "VOICE CALL" button
4. Check browser console - you should see real tokens instead of mock ones

## What This Fixes
- ✅ Real LiveKit tokens instead of mock ones
- ✅ Proper voice connections
- ✅ Agent joining functionality
- ✅ Full voice chat capability

## Verification
After setup, visit: `https://your-site.netlify.app/test-voice`
This will show you if the environment variables are properly configured.
