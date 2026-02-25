require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const voiceRoutes = require('./voice');

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = process.env.XPECTRUM_API_BASE_URL 
  ? `${process.env.XPECTRUM_API_BASE_URL}/chat-messages` 
  : process.env.DIFY_API_BASE_URL 
    ? `${process.env.DIFY_API_BASE_URL}/chat-messages` 
    : 'https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1/chat-messages';
const API_KEY = process.env.XPECTRUM_API_KEY || process.env.DIFY_API_KEY || 'app-MCjDesYMQxIhZjdgziHWyN1G';

app.post('/chat', async (req, res) => {
  try {
    console.log('=== CHAT REQUEST DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Conversation ID:', req.body.conversation_id);
    console.log('Query:', req.body.query);

    // Build the proxied request body while keeping query dynamic.
    // Default fields follow the curl example: inputs ({}), response_mode (streaming), conversation_id ('').
    const incoming = req.body || {};
    const requestBody = { ...incoming };
    if (!('inputs' in requestBody) || requestBody.inputs == null) requestBody.inputs = {};
    if (!('response_mode' in requestBody) || requestBody.response_mode == null) requestBody.response_mode = 'streaming';
    if (requestBody.conversation_id === undefined || requestBody.conversation_id === null) requestBody.conversation_id = '';
    if (!('files' in requestBody) || requestBody.files == null) requestBody.files = [];

    console.log('Proxying request to API URL:', API_URL);
    console.log('Proxy request body (trimmed):', JSON.stringify({
      query: requestBody.query,
      response_mode: requestBody.response_mode,
      conversation_id: requestBody.conversation_id,
      user: requestBody.user,
      files: requestBody.files && requestBody.files.length ? requestBody.files : undefined,
    }, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('API Response status:', response.status);
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

    // If the API returned 404, try again creating a new conversation (empty conversation_id)
    if (response.status === 404) {
      console.log('Conversation not found, retrying with empty conversation_id...');
      const newConversationBody = { ...requestBody, conversation_id: '' };
      console.log('New conversation request body (trimmed):', JSON.stringify({ query: newConversationBody.query, conversation_id: newConversationBody.conversation_id }, null, 2));

      const newConversationResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConversationBody),
      });

      console.log('New conversation response status:', newConversationResponse.status);
      // Forward status and content-type header if available
      res.status(newConversationResponse.status);
      const ct = newConversationResponse.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);

      if (newConversationResponse.body && typeof newConversationResponse.body.pipe === 'function') {
        newConversationResponse.body.pipe(res);
      } else {
        const text = await newConversationResponse.text();
        res.send(text);
      }
      return;
    }

    // Forward upstream status and content-type header where possible
    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    // If the response body is a stream, pipe it directly. Otherwise read text and send.
    if (response.body && typeof response.body.pipe === 'function') {
      response.body.pipe(res);
    } else {
      const text = await response.text();
      // Try to parse JSON to send as JSON, but fall back to plain text
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch (e) {
        res.send(text);
      }
    }
  } catch (err) {
    console.error('Chat proxy error:', err);
    // Don't return error responses - let Dify handle it
    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});

// Use voice routes
app.use('/', voiceRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Chatbot proxy server running on port ${PORT}`);
}); 