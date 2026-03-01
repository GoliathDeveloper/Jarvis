import Head from 'next/head'
import { useState, useEffect } from 'react'
// No external HTTP library needed – use the browser fetch API

export default function Home() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2:1.5b',
          messages: [{ role: 'user', content: input }],
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let lines = buffer.split('\n')
        buffer = lines.pop() // last incomplete line
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const part = JSON.parse(line)
            if (part.message && part.message.content) {
              full += part.message.content
            }
          } catch (e) {
            // ignore malformed lines
          }
        }
      }
      setResponse(full)
    } catch (err) {
      console.error(err)
      setResponse('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Update body class when dark mode changes
  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [dark])

  return (
    <div>
      <Head>
        <title>Hailo Ollama Frontend</title>
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Hailo‑Ollama Chat</h1>
        <button onClick={() => setDark(!dark)} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.target.form.requestSubmit()
              }
            }}
            rows={4}
            cols={50}
            placeholder="Ask something…"
          />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </form>
        <pre>{response}</pre>
      </main>
    </div>
  )
}
