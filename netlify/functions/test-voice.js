exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Voice test function is working',
      timestamp: new Date().toISOString(),
      environment: {
        VITE_VOICE_API_KEY: process.env.VITE_VOICE_API_KEY ? 'SET' : 'NOT SET',
        VOICE_API_KEY: process.env.VOICE_API_KEY ? 'SET' : 'NOT SET',
        VOICE_API_BASE_URL: process.env.VOICE_API_BASE_URL ? 'SET' : 'NOT SET',
      },
      availableEnvVars: Object.keys(process.env).filter(key => 
        key.includes('VOICE') || key.includes('API') || key.includes('DIFY')
      )
    }),
  };
};
