// Netlify Function: Cartesia TTS proxy
// Accepts POST { text: string, voiceId?: string }
// Returns audio/wav as base64 (isBase64Encoded=true)

const https = require('https');

function fetchCartesiaAudio(voiceId, apiKey, text) {
  const payload = JSON.stringify({
    model_id: 'sonic-3',
    transcript: text,
    voice: {
      mode: 'id',
      id: voiceId
    },
    output_format: {
      container: 'mp3',
      encoding: 'mp3',
      sample_rate: 44100
    },
    speed: 'normal',
    generation_config: {
      speed: 1.0,  // Normal speed (1.0 = normal, higher = faster)
      volume: 1
    }
  });

  const options = {
    hostname: 'api.cartesia.ai',
    path: '/tts/bytes',
    method: 'POST',
    headers: {
      'Cartesia-Version': '2024-06-10',
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Cartesia error ${res.statusCode}: ${Buffer.concat(chunks).toString('utf8')}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  console.log('🔊 TTS Function Called:', {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body
  });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const text = (body.text || '').toString();
    const requestedVoiceId = (body.voiceId || '').toString();

    console.log('🔊 TTS Request Details:', {
      textLength: text.length,
      requestedVoiceId,
      hasText: !!text.trim()
    });

    if (!text.trim()) {
      console.error('🔊 TTS Error: Missing text');
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing text' }) };
    }

    // Prefer Netlify env; fall back to hardcoded values as last resort
    const envApiKey = process.env.CARTESIA_API_KEY || process.env.VITE_CARTESIA_API_KEY;
    const envVoiceId = process.env.CARTESIA_VOICE_ID || process.env.VITE_CARTESIA_VOICE_ID;
    
    // Fallback to known working values if env vars not set or invalid
    const fallbackApiKey = 'sk_car_uDYkY7f1JYTE5eB3AKqfEV';
    const fallbackVoiceId = '5c5ad5e7-1020-476b-8b91-fdcbe9cc313c';
    
    const apiKey = envApiKey || fallbackApiKey;
    const voiceId = requestedVoiceId || envVoiceId || fallbackVoiceId;

    console.log('🔊 TTS Configuration:', {
      hasEnvApiKey: !!envApiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      hasEnvVoiceId: !!envVoiceId,
      finalVoiceId: voiceId,
      usingFallback: !envApiKey,
      availableEnvVars: Object.keys(process.env).filter(k => k.includes('CARTESIA') || k.includes('TTS'))
    });

    if (!apiKey || !voiceId) {
      console.error('🔊 TTS Error: Missing configuration', {
        hasApiKey: !!apiKey,
        hasVoiceId: !!voiceId
      });
      return { 
        statusCode: 500, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'TTS not configured on server', hasApiKey: !!apiKey, hasVoiceId: !!voiceId })
      };
    }

    console.log('🔊 Calling Cartesia API...');
    let audioBuffer;
    
    try {
      audioBuffer = await fetchCartesiaAudio(voiceId, apiKey, text);
    } catch (error) {
      // If API key from env vars fails with any API key error, retry with fallback
      const isApiKeyError = error.message.includes('invalid') || 
                           error.message.includes('unauthorized') ||
                           error.message.includes('forbidden') ||
                           error.message.includes('401') ||
                           error.message.includes('403');
      
      if (envApiKey && apiKey === envApiKey && isApiKeyError) {
        console.warn('🔊 Env API key failed, retrying with fallback key...', {
          error: error.message.substring(0, 100),
          voiceId: voiceId
        });
        const fallbackApiKey = 'sk_car_uDYkY7f1JYTE5eB3AKqfEV';
        const fallbackVoiceId = '5c5ad5e7-1020-476b-8b91-fdcbe9cc313c';
        try {
          audioBuffer = await fetchCartesiaAudio(fallbackVoiceId, fallbackApiKey, text);
          console.log('🔊 Fallback API key succeeded');
        } catch (fallbackError) {
          console.error('🔊 Both API keys failed:', fallbackError.message);
          throw fallbackError;
        }
      } else {
        // If already using fallback or different error, throw as-is
        console.error('🔊 TTS Error (no retry):', error.message.substring(0, 150));
        throw error;
      }
    }
    
    console.log('🔊 Cartesia Response:', {
      audioSize: audioBuffer.length,
      audioSizeKB: Math.round(audioBuffer.length / 1024)
    });

    const base64Audio = audioBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
      isBase64Encoded: true,
      body: base64Audio,
    };
  } catch (err) {
    console.error('🔊 TTS Function Error:', {
      message: err.message,
      stack: err.stack
    });
    return { 
      statusCode: 500, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};

