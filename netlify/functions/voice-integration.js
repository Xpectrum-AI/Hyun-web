exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters, body } = event;
    
    console.log('=== NETLIFY VOICE FUNCTION DEBUG ===');
    console.log('HTTP Method:', httpMethod);
    console.log('Path:', path);
    console.log('Query params:', queryStringParameters);

    // Handle different endpoints
    if (path.includes('/tokens/generate')) {
      const agentName = queryStringParameters?.agent_name || 'hyun';
      
      // Check if we have environment variables for real API calls
      const apiKey = process.env.VOICE_API_KEY;
      const backendUrl = process.env.VOICE_API_BASE_URL;
      
      console.log('Environment check:', {
        apiKey: !!apiKey,
        backendUrl: !!backendUrl,
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('VOICE') || key.includes('API'))
      });
      
      if (!apiKey || !backendUrl) {
        // Return a mock response that won't cause connection errors
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token: 'mock_token_for_netlify_testing',
            room_name: `${agentName}-${Date.now()}`,
            agent_name: agentName,
            unique_id: Date.now().toString(),
            client_ip: '127.0.0.1',
            livekit_url: 'wss://multi-agent-prod-eks-deployment-kqx0th32.livekit.cloud',
            message: 'Mock token - configure VOICE_API_KEY and VOICE_API_BASE_URL for real tokens',
            environment_configured: false
          }),
        };
      }
      
      // If environment variables are set, make real API call
      try {
        const requestUrl = `${backendUrl}/tokens/generate?agent_name=${agentName}`;
        console.log(`Making real API call to: ${requestUrl}`);
        
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Real API response:', data);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
          };
        } else {
          console.error(`API error: ${response.status}`);
          const errorText = await response.text();
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({
              error: 'API call failed',
              status: response.status,
              message: errorText
            }),
          };
        }
      } catch (error) {
        console.error('API call error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'API call failed',
            message: error.message
          }),
        };
      }
    }

    if (path.includes('/agents/join')) {
      const requestBody = JSON.parse(body || '{}');
      const apiKey = process.env.VOICE_API_KEY;
      const backendUrl = process.env.VOICE_API_BASE_URL;
      
      if (!apiKey || !backendUrl) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Mock agent join - configure VOICE_API_KEY and VOICE_API_BASE_URL for real agent',
            room_name: requestBody.room_name || 'test-room',
            agent_name: requestBody.agent_name || 'hyun',
            environment_configured: false
          }),
        };
      }
      
      // Make real API call
      try {
        const response = await fetch(`${backendUrl}/agents/join`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
          };
        } else {
          const errorText = await response.text();
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({
              error: 'Agent join failed',
              status: response.status,
              message: errorText
            }),
          };
        }
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Agent join failed',
            message: error.message
          }),
        };
      }
    }

    // Default response for root path
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Voice integration function is running',
        endpoints: ['/tokens/generate', '/agents/join'],
        version: '1.0'
      }),
    };

  } catch (error) {
    console.error('Voice integration function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
    };
  }
};
