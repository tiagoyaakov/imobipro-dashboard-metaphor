// Vercel Serverless Function para OAuth Google Calendar
// Mantém o client_secret seguro no backend

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://imobpro-brown.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, code, refresh_token } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('OAuth Config Error:', {
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
        hasRedirectUri: !!REDIRECT_URI
      });
      return res.status(500).json({ 
        error: 'Google OAuth not configured',
        details: {
          clientId: CLIENT_ID ? 'configured' : 'missing',
          clientSecret: CLIENT_SECRET ? 'configured' : 'missing',
          redirectUri: REDIRECT_URI ? 'configured' : 'missing'
        }
      });
    }

    let tokenResponse;

    if (action === 'exchange_code') {
      // Trocar código por tokens
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

    } else if (action === 'refresh_token') {
      // Renovar access token
      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
        }),
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google OAuth Error:', tokenData);
      return res.status(tokenResponse.status).json({
        error: tokenData.error_description || tokenData.error || 'OAuth error'
      });
    }

    // Retornar tokens sem expor client_secret
    res.status(200).json(tokenData);

  } catch (error) {
    console.error('Proxy OAuth Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}