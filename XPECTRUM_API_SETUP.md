# Xpectrum AI API Configuration

## API Endpoint
- **Base URL:** `https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1`
- **Chat Messages Endpoint:** `https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1/chat-messages`

## API Key
- **API Key:** `app-WxAWGosGXvslDCmQdLg2wlHz`
- **Note:** If you have an API secret, you may need to format the key as `app-WxAWGosGXvslDCmQdLg2wlHz:api_secret` or use it separately based on Xpectrum AI's authentication requirements.

## Environment Variables

### For Netlify (Production)
Set these in your Netlify dashboard under **Site Settings → Environment Variables**:

```
XPECTRUM_API_KEY=app-WxAWGosGXvslDCmQdLg2wlHz
XPECTRUM_API_BASE_URL=https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1
```

**Note:** The code also supports the old `DIFY_API_KEY` and `DIFY_API_BASE_URL` variables for backward compatibility.

### For Local Development
Create or update your `.env` file in the project root:

```
XPECTRUM_API_KEY=app-WxAWGosGXvslDCmQdLg2wlHz
XPECTRUM_API_BASE_URL=https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1
```

## API Request Format

The chatbot uses the following request format (as shown in the curl example):

```bash
curl -X POST 'https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1/chat-messages' \
  --header 'Authorization: Bearer {api_key}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "What are the specs of the iPhone 13 Pro Max?",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123",
    "files": [
      {
        "type": "image",
        "transfer_method": "remote_url",
        "url": "https://cloud.dify.ai/logo/logo-site.png"
      }
    ]
  }'
```

## Updated Files

1. **`netlify/functions/chatbot-proxy.js`** - Netlify serverless function that proxies requests to Xpectrum AI
2. **`backend/index.js`** - Local development backend server

Both files now:
- Use the new Xpectrum AI API endpoint
- Support both `XPECTRUM_API_*` and `DIFY_API_*` environment variables (for backward compatibility)
- Fall back to the new endpoint if no environment variables are set

## Testing

### Test the API directly:
```bash
curl -X POST 'https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1/chat-messages' \
  --header 'Authorization: Bearer app-WxAWGosGXvslDCmQdLg2wlHz' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "Hello, what services do you offer?",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "test-user"
  }'
```

### Test via Netlify Function:
```bash
curl -X POST 'https://your-site.netlify.app/.netlify/functions/chatbot-proxy' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "Hello",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "test-user"
  }'
```

## Troubleshooting

1. **401 Unauthorized:** Check that your API key is correct and properly set in environment variables
2. **404 Not Found:** Verify the API endpoint URL is correct
3. **CORS Issues:** The Netlify function handles CORS automatically
4. **Streaming Issues:** Ensure `response_mode: "streaming"` is set in the request body

## Notes

- The API key format may need adjustment if Xpectrum AI requires a secret component
- If authentication fails, try formatting the key as `app-WxAWGosGXvslDCmQdLg2wlHz:api_secret` (replace `api_secret` with the actual secret)
- The chatbot maintains conversation context using the `conversation_id` field

