// Voice integration function using only built-in Node.js modules
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Helper function to make HTTP requests without external dependencies
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

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
    
    console.log('=== NETLIFY VOICE FUNCTION V2 DEBUG ===');
    console.log('HTTP Method:', httpMethod);
    console.log('Path:', path);
    console.log('Query params:', queryStringParameters);

    // Get environment variables
    const apiKey = process.env.VOICE_API_KEY;
    const backendUrl = process.env.VOICE_API_BASE_URL;
    
    console.log('API Key present:', !!apiKey);
    console.log('Backend URL present:', !!backendUrl);

    if (!apiKey || !backendUrl) {
      console.error('Missing environment variables for voice integration');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('VOICE') || key.includes('API')));
      
      // Return a mock response for testing
      if (path.includes('/tokens/generate')) {
        const agentName = queryStringParameters?.agent_name || 'hyun';
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
            message: 'Mock token - configure VOICE_API_KEY and VOICE_API_BASE_URL for real tokens'
          }),
        };
      }
      
      if (path.includes('/agents/join')) {
        const requestBody = JSON.parse(body || '{}');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Mock agent join - configure VOICE_API_KEY and VOICE_API_BASE_URL for real agent',
            room_name: requestBody.room_name || 'test-room',
            agent_name: requestBody.agent_name || 'hyun'
          }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Voice integration function v2 is running (mock mode)',
          endpoints: ['/tokens/generate', '/agents/join'],
          version: '2.0',
          note: 'Configure VOICE_API_KEY and VOICE_API_BASE_URL for real functionality'
        }),
      };
    }

    // Handle different endpoints
    if (path.includes('/tokens/generate')) {
      const agentName = queryStringParameters?.agent_name || 'hyun';
      const requestUrl = `${backendUrl}/tokens/generate?agent_name=${agentName}`;
      
      console.log(`Calling backend: ${requestUrl}`);
      
      try {
        const response = await makeRequest(requestUrl, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          }
        });

        console.log(`Backend response status: ${response.status}`);

        if (response.status >= 200 && response.status < 300) {
          const data = JSON.parse(response.data);
          console.log(`Token generation response data:`, data);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
          };
        } else {
          console.error(`Backend error: ${response.status} - ${response.data}`);
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({ 
              error: 'Backend service error',
              status: response.status,
              message: response.data
            }),
          };
        }
      } catch (error) {
        console.error('Request error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Request failed',
            message: error.message
          }),
        };
      }
    }

    if (path.includes('/agents/join')) {
      const requestBody = JSON.parse(body || '{}');
      const requestUrl = `${backendUrl}/agents/join`;
      
      console.log('Agent join request body:', requestBody);
      
      try {
        const response = await makeRequest(requestUrl, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`Backend response status: ${response.status}`);

        if (response.status >= 200 && response.status < 300) {
          const data = JSON.parse(response.data);
          console.log(`Agent join response data:`, data);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
          };
        } else {
          console.error(`Backend error: ${response.status} - ${response.data}`);
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({ 
              error: 'Backend service error',
              status: response.status,
              message: response.data
            }),
          };
        }
      } catch (error) {
        console.error('Request error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Request failed',
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
        message: 'Voice integration function v2 is running',
        endpoints: ['/tokens/generate', '/agents/join'],
        version: '2.0'
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
