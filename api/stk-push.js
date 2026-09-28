export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, amount, reference, description, callbackUrl } = req.body || {};
  if (!phone || !amount || !reference) {
    return res.status(400).json({ error: 'phone, amount and reference are required' });
  }

  const payload = {
    phone,
    amount,
    reference,
    channelId: process.env.REACT_APP_PAYLOR_CHANNEL_ID,
    description: description || 'HANDSHAKE AI - Chat Activation Fee',
    callbackUrl: callbackUrl || 'https://handshakeai.com/callback'
  };

  try {
    const response = await fetch('https://api.paylorke.com/api/v1/merchants/payments/stk-push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_PAYLOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Paylor STK push failed', details: data });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
