require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Voice integration endpoints
app.post('/voice/tokens/generate', async (req, res) => {
  try {
    const { agent_name = 'hyun' } = req.query;
    const apiKey = process.env.VOICE_API_KEY;
    const backendUrl = process.env.VOICE_API_BASE_URL;
    
    console.log(`=== TOKEN GENERATION DEBUG ===`);
    console.log(`Agent name: ${agent_name}`);
    console.log(`API Key present: ${!!apiKey}`);
    console.log(`Backend URL present: ${!!backendUrl}`);
    console.log(`API Key value: ${apiKey}`);
    console.log(`Backend URL value: ${backendUrl}`);
    console.log(`Environment variables:`, {
      VOICE_API_KEY: process.env.VOICE_API_KEY,
      VOICE_API_BASE_URL: process.env.VOICE_API_BASE_URL
    });
    
    if (!apiKey || !backendUrl) {
      console.log('Missing environment variables - returning mock token');
      return res.json({ 
        token: 'mock_token_for_testing_purposes_only',
        room_name: 'test-room',
        participant_identity: agent_name,
        message: 'Mock token - configure VOICE_API_KEY and VOICE_API_BASE_URL for real tokens'
      });
    }
    
    try {
      console.log(`Calling backend: ${backendUrl}/tokens/generate?agent_name=${agent_name}`);
      
      const response = await fetch(`${backendUrl}/tokens/generate?agent_name=${agent_name}`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Backend response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({ 
          error: 'Backend service error',
          status: response.status,
          message: errorText
        });
      }

      const data = await response.json();
      console.log(`Token generation response data:`, data);
      
      return res.json(data);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ 
        error: 'Backend connection failed',
        message: fetchError.message
      });
    }
  } catch (error) {
    console.error('Voice token generation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/voice/agents/join', async (req, res) => {
  try {
    const { agent_name, room_name, action } = req.body;
    const apiKey = process.env.VOICE_API_KEY;
    const backendUrl = process.env.VOICE_API_BASE_URL;
    
    console.log('=== AGENT JOIN DEBUG ===');
    console.log('Agent join request body:', req.body);
    console.log('API Key present:', !!apiKey);
    console.log('Backend URL present:', !!backendUrl);
    
    if (!apiKey || !backendUrl) {
      console.log('Missing environment variables - returning mock response');
      return res.json({ 
        success: true,
        message: 'Mock agent join - configure VOICE_API_KEY and VOICE_API_BASE_URL for real agent',
        room_name: room_name || 'test-room',
        agent_name: agent_name || 'hyun'
      });
    }
    
    try {
      console.log(`Calling backend: ${backendUrl}/agents/join`);
      
      const response = await fetch(`${backendUrl}/agents/join`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });

      console.log(`Backend response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend error: ${response.status} - ${errorText}`);
        
        // Return a mock success response if backend is not available
        if (response.status === 404) {
          console.log('Backend returned 404 - returning mock response');
          return res.json({ 
            success: true,
            message: 'Mock agent join - backend service not available',
            room_name: room_name || 'test-room',
            agent_name: agent_name || 'hyun'
          });
        }
        
        return res.status(response.status).json({ 
          error: 'Backend service error',
          status: response.status,
          message: errorText
        });
      }

      const data = await response.json();
      console.log(`Agent join response data:`, data);
      
      return res.json(data);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      
      // Return a mock success response if connection fails
      console.log('Connection failed - returning mock response');
      return res.json({ 
        success: true,
        message: 'Mock agent join - connection failed',
        room_name: room_name || 'test-room',
        agent_name: agent_name || 'hyun'
      });
    }
  } catch (error) {
    console.error('Voice agent join error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/voice', (req, res) => {
  res.json({
    message: "Hyun Voice Integration API",
    version: "1.0.0",
    endpoints: [
      "/voice/tokens/generate?agent_name=hyun",
      "/voice/agents/join"
    ]
  });
});

module.exports = app;
