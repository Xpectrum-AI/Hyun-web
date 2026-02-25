// Chatbot proxy function using only built-in Node.js modules
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
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { httpMethod, body } = event;
    
    console.log('=== CHATBOT PROXY DEBUG ===');
    console.log('HTTP Method:', httpMethod);
    console.log('Body:', body);

    // Get environment variables
    const apiKey = process.env.XPECTRUM_API_KEY || process.env.DIFY_API_KEY;
    const apiUrl = process.env.XPECTRUM_API_BASE_URL || process.env.DIFY_API_BASE_URL;
    
    console.log('API Key present:', !!apiKey);
    console.log('API URL present:', !!apiUrl);

    if (!apiKey || !apiUrl) {
      console.error('Missing environment variables for chatbot');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DIFY') || key.includes('API') || key.includes('XPECTRUM')));
      
      // Use fallback values if environment variables are not set
      const fallbackApiKey = 'app-WxAWGosGXvslDCmQdLg2wlHz';
      const fallbackApiUrl = 'https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1';
      
      console.log('Using fallback API configuration');
      console.log('Fallback API Key:', fallbackApiKey);
      console.log('Fallback API URL:', fallbackApiUrl);
      
      // Continue with fallback values instead of returning error
      const finalApiKey = apiKey || fallbackApiKey;
      const finalApiUrl = apiUrl || fallbackApiUrl;
      
      console.log('Final API Key:', finalApiKey);
      console.log('Final API URL:', finalApiUrl);
    }

    if (httpMethod === 'POST') {
      const requestBody = JSON.parse(body || '{}');
      const finalApiKey = apiKey || 'app-WxAWGosGXvslDCmQdLg2wlHz';
      const finalApiUrl = apiUrl || 'https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1';
      const requestUrl = `${finalApiUrl}/chat-messages`;
      
      console.log(`Calling Xpectrum AI API: ${requestUrl}`);
      
      try {
        console.log('Request details:', {
          url: requestUrl,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${finalApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const response = await makeRequest(requestUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${finalApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`Xpectrum AI API response status: ${response.status}`);
        console.log(`Xpectrum AI API response data: ${response.data.substring(0, 200)}...`);

        if (response.status >= 200 && response.status < 300) {
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: response.data,
          };
        } else {
          console.error(`Xpectrum AI API error: ${response.status} - ${response.data}`);
          // Return a proper error response instead of the API error
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              event: 'agent_message',
              answer: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
              conversation_id: 'error-' + Date.now()
            }),
          };
        }
      } catch (error) {
        console.error('Request error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            event: 'agent_message',
            answer: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
            conversation_id: 'error-' + Date.now()
          }),
        };
      }
    }

    // Default response for GET requests
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Chatbot proxy function is running',
        endpoints: ['POST /chat']
      }),
    };

  } catch (error) {
    console.error('Chatbot proxy function error:', error);
    console.error('Function error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        event: 'agent_message',
        answer: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
        conversation_id: 'error-' + Date.now()
      }),
    };
  }
};
