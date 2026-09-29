export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { transactionId } = req.query;
  if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });

  try {
    const response = await fetch(`https://api.paylorke.com/api/v1/merchants/payments/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_PAYLOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Query failed' });

    return res.status(200).json({ status: data.status, mpesaReceipt: data.mpesaReceipt || null });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}