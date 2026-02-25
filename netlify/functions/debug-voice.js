// Debug function to test voice integration
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters } = event;
    
    console.log('=== DEBUG VOICE FUNCTION ===');
    console.log('HTTP Method:', httpMethod);
    console.log('Path:', path);
    console.log('Query params:', queryStringParameters);
    console.log('Headers:', event.headers);

    // Check environment variables
    const apiKey = process.env.VOICE_API_KEY;
    const backendUrl = process.env.VOICE_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;
    const difyApiUrl = process.env.DIFY_API_BASE_URL;
    
    console.log('Environment variables:');
    console.log('VOICE_API_KEY present:', !!apiKey);
    console.log('VOICE_API_BASE_URL present:', !!backendUrl);
    console.log('DIFY_API_KEY present:', !!difyApiKey);
    console.log('DIFY_API_BASE_URL present:', !!difyApiUrl);

    const debugInfo = {
      message: 'Debug voice function is working',
      timestamp: new Date().toISOString(),
      environment: {
        voiceApiKeyPresent: !!apiKey,
        voiceApiUrlPresent: !!backendUrl,
        difyApiKeyPresent: !!difyApiKey,
        difyApiUrlPresent: !!difyApiUrl,
        nodeVersion: process.version,
        functionName: 'debug-voice'
      },
      request: {
        method: httpMethod,
        path: path,
        queryParams: queryStringParameters,
        headers: event.headers
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debugInfo),
    };

  } catch (error) {
    console.error('Debug function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Debug function error', 
        details: error.message 
      }),
    };
  }
};
