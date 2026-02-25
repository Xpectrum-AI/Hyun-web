# Netlify Deployment Guide

## Environment Variables Setup

To deploy the Hyun website with voice call functionality on Netlify, you need to set up the following environment variables in your Netlify dashboard:

### Required Environment Variables:

1. **VOICE_API_KEY**: `xpectrum-ai@123`
2. **VOICE_API_BASE_URL**: `https://d3sgivh2kmd3c8.cloudfront.net`
3. **VITE_VOICE_API_KEY**: `xpectrum-ai@123` (for frontend)
4. **DIFY_API_BASE_URL**: `https://demos.xpectrum-ai.com/v1`
5. **DIFY_API_KEY**: `app-qXbGcG3BX32wyKAIQP9Vlnol`

### How to Set Environment Variables in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add each variable with its corresponding value
5. Redeploy your site

## Netlify Functions

The deployment includes the following Netlify Functions:

- **voice-integration**: Handles voice call token generation and agent joining
- **test-voice**: Test function to verify Netlify Functions are working

## Build Configuration

The `netlify.toml` file configures:
- Build command: `npm run build`
- Publish directory: `dist`
- Node.js version: 18
- Redirects for API endpoints

## Troubleshooting

### Voice Call Not Working:
1. Check that all environment variables are set correctly
2. Verify the Netlify Functions are deployed (check Functions tab in Netlify dashboard)
3. Check browser console for any CORS or API errors
4. Ensure the voice API credentials are valid

### Chatbot Not Working:
1. Verify DIFY_API_KEY and DIFY_API_BASE_URL are set
2. Check that the Dify API is accessible
3. Look for any 404 errors in the browser console

## Testing

After deployment, you can test:
1. Visit `https://your-site.netlify.app/.netlify/functions/test-voice` to test Netlify Functions
2. Try the voice call button to test voice integration
3. Use the chatbot to test Dify AI integration
