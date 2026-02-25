// Simple health check function with no external dependencies
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      message: 'Netlify Functions are working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
      functionName: 'health-check'
    }),
  };
};
