import { useMemo, useState } from 'react'
import GraphView from './GraphView'
import { AnalysisResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function App() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)

  const canSubmit = useMemo(() => text.trim().length > 0 || url.trim().length > 0, [text, url])

  async function submit() {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text || undefined, url: url || undefined })
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.detail || 'Analysis failed')
      }
      setAnalysis((await response.json()) as AnalysisResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <h1>Cognitive Landscape</h1>
      <p>Map belief clusters and contradictions from web or article text.</p>

      <section className="panel">
        <label>Article URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" />

        <label>Or paste text</label>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste article content here..."
        />

        <button onClick={submit} disabled={!canSubmit || loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      {analysis && (
        <>
          <section className="panel">
            <h2>Belief Graph</h2>
            <GraphView nodes={analysis.graph.nodes} edges={analysis.graph.edges} />
          </section>

          <section className="two-col">
            <article className="panel">
              <h2>Extracted Claims</h2>
              <ul>
                {analysis.claims.map((claim, idx) => (
                  <li key={`${idx}-${claim}`}>{claim}</li>
                ))}
              </ul>
            </article>

            <article className="panel">
              <h2>Contradiction Explorer</h2>
              {analysis.contradictions.length === 0 ? (
                <p>No contradictions detected.</p>
              ) : (
                analysis.contradictions.map((c, idx) => (
                  <div className="contradiction" key={`${idx}-${c.left}-${c.right}`}>
                    <p>{c.left}</p>
                    <span>↔</span>
                    <p>{c.right}</p>
                  </div>
                ))
              )}
            </article>
          </section>
        </>
      )}
    </main>
  )
}
