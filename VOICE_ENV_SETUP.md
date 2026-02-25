# Voice API Environment Setup

## Environment Variables Required

Create a `.env` file in the project root with the following variables:

```env
# Voice API Configuration
VITE_VOICE_API_KEY=xpectrum-ai@123
VOICE_API_KEY=xpectrum-ai@123
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
```

## Current Configuration

The voice functionality is now configured with:

- **Agent Name**: `pravina`
- **API Key**: `xpectrum-ai@123`
- **Base URL**: `https://d3sgivh2kmd3c8.cloudfront.net`

## Testing Voice Call

1. Open http://localhost:1000
2. Click the "VOICE CALL" button (bottom right)
3. Grant microphone permissions when prompted
4. The system will attempt to connect to the Pravina agent

## Backend Endpoints

- `POST /voice/tokens/generate` - Generate LiveKit tokens
- `POST /voice/agents/join` - Trigger agent to join call
- `GET /voice` - API information

## Troubleshooting

If voice calls don't work:
1. Check browser console for errors
2. Check backend logs for API responses
3. Ensure microphone permissions are granted
4. Verify API credentials are correct
