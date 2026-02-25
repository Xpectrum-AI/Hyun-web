# Voice Call Integration Setup

## Overview
The Hyun website now includes voice call functionality similar to the Dr. Pravina website. Users can make voice calls directly from the chat interface.

## Features Added

### 1. VoiceChatWidget Component
- **Location**: `src/components/VoiceChatWidget.tsx`
- **Variants**: 
  - `chatbar`: Compact phone icon for chat interface
  - `standalone`: Full button for main pages

### 2. Backend Voice Integration
- **Location**: `backend/voice.js`
- **Endpoints**:
  - `POST /voice/tokens/generate` - Generate LiveKit tokens
  - `POST /voice/agents/join` - Trigger agent to join call
  - `GET /voice` - API information

### 3. Integration Points
- **Chat Interface**: Voice button in chat input area
- **Homepage**: Standalone voice widget (bottom right)
- **All Pages**: Can be added to any page

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the project root with:
```env
VITE_VOICE_API_KEY=your_voice_api_key_here
VOICE_API_KEY=your_voice_api_key_here
VOICE_API_BASE_URL=https://your-voice-api-base-url.com
```

### 2. Dependencies
The following dependency has been added:
- `livekit-client` - For real-time voice communication

### 3. Usage
1. **In Chat Interface**: Click the phone icon in the chat input area
2. **On Main Pages**: Click the "VOICE CALL" button in the bottom right
3. **Call Flow**: 
   - Click to start call
   - Grant microphone permissions
   - Agent joins automatically
   - Click to end call

## Configuration

### Agent Name
The voice widget is configured to use "hyun" as the agent name. This can be changed in:
- `VoiceChatWidget.tsx` line 104: `const agentName = 'hyun';`

### Styling
The voice widget uses the Hyun brand colors:
- **Idle/Connecting**: `#0c202b` (dark navy)
- **Connected**: `#ef4444` (red)

## Testing
1. Start both servers:
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd backend && node index.js
   ```

2. Open http://localhost:1000
3. Click the voice call button
4. Grant microphone permissions when prompted

## Notes
- The voice functionality requires microphone permissions
- Currently configured with mock tokens for testing
- Real implementation requires proper LiveKit setup and agent configuration
- Similar to Dr. Pravina website implementation but adapted for Hyun branding
