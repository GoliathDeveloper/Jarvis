import axios from 'axios'

export default async function handler(req, res) {
  const targetUrl = 'http://192.168.0.2:8000/api/chat'
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
    })
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    // Pipe the response stream
    response.data.pipe(res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
