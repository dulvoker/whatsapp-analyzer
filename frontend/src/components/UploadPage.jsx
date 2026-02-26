import { useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function UploadPage({ onData }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  async function upload(file) {
    if (!file || !file.name.endsWith('.txt')) {
      setError('Please upload a .txt file exported from WhatsApp.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.detail || 'Upload failed')
      }
      onData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    upload(e.dataTransfer.files[0])
  }

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.label}>// whatsapp chat analysis</div>
        <h1 style={styles.title}>Chat<span style={{ color: 'var(--accent2)' }}>.</span>Analyzer</h1>
        <p style={styles.sub}>Export your chat (without media) and drop it below.</p>

        <div
          style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDrag : {}) }}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {loading ? (
            <div style={styles.spinner} />
          ) : (
            <>
              <div style={styles.dropIcon}>↑</div>
              <div style={styles.dropText}>Drop your <strong>_chat.txt</strong> here</div>
              <div style={styles.dropHint}>or click to browse</div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          style={{ display: 'none' }}
          onChange={e => upload(e.target.files[0])}
        />

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.instructions}>
          <div style={styles.step}><span style={{ color: 'var(--accent1)' }}>01</span> Open WhatsApp → Chat → ··· → Export Chat</div>
          <div style={styles.step}><span style={{ color: 'var(--accent1)' }}>02</span> Choose <strong>Without Media</strong></div>
          <div style={styles.step}><span style={{ color: 'var(--accent1)' }}>03</span> Upload the .txt file here</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  inner: {
    maxWidth: 480,
    width: '100%',
  },
  label: {
    fontSize: 10,
    color: 'var(--accent1)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 52,
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 12,
  },
  sub: {
    color: 'var(--muted)',
    fontSize: 13,
    marginBottom: 32,
    lineHeight: 1.6,
  },
  dropzone: {
    border: '1px dashed var(--muted)',
    padding: '48px 32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: 'var(--surface)',
    marginBottom: 16,
  },
  dropzoneDrag: {
    borderColor: 'var(--accent1)',
    background: 'var(--surface2)',
  },
  dropIcon: {
    fontSize: 32,
    color: 'var(--accent1)',
    marginBottom: 12,
  },
  dropText: {
    fontSize: 14,
    marginBottom: 6,
  },
  dropHint: {
    color: 'var(--muted)',
    fontSize: 11,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--accent1)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  error: {
    background: '#2a0a0a',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '10px 14px',
    fontSize: 12,
    marginBottom: 16,
  },
  instructions: {
    marginTop: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  step: {
    color: 'var(--muted)',
    fontSize: 12,
    lineHeight: 1.5,
    display: 'flex',
    gap: 12,
  },
}
