'use client'

import { useState, useRef, useTransition } from 'react'
import { importCards, type ImportResult } from '@/lib/actions/import'

interface Props {
  folderId: string | null
}

export default function FolderImportButton({ folderId }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setText('')
    setResult(null)
    setError(null)
    setOpen(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : ''
      setText(content)
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!text.trim()) return
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const r = await importCards(folderId, text)
        setResult(r)
        if (r.successCount > 0) setText('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Import failed.')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--foreground)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ↥ Import CSV
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={e => { if (e.target === e.currentTarget && !isPending) reset() }}
    >
      <div style={{
        background: 'var(--card)',
        borderRadius: 18,
        width: '100%',
        maxWidth: 560,
        padding: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Import cards
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)' }}>
          One card per line: <code>front,back</code> or <code>front,back,hint</code>.
          Use quotes around fields containing commas. Lines starting with <code>#</code> are comments.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            style={ghostBtn}
          >
            Choose file…
          </button>
          {text && (
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', alignSelf: 'center' }}>
              {text.length.toLocaleString()} chars loaded
            </span>
          )}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`What's the capital of France?,Paris\nHello in Spanish,Hola,Common greeting`}
          rows={8}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: 13,
            fontFamily: 'var(--font-mono), monospace',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {result && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: result.errorCount > 0
              ? 'color-mix(in srgb, #f59e0b 14%, transparent)'
              : 'color-mix(in srgb, #22c55e 14%, transparent)',
            border: `1px solid ${result.errorCount > 0 ? '#f59e0b40' : '#22c55e40'}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              Imported {result.successCount} of {result.total} cards.
              {result.errorCount > 0 && ` ${result.errorCount} skipped.`}
            </p>
            {result.errors.length > 0 && (
              <details style={{ marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                <summary style={{ cursor: 'pointer' }}>Show errors</summary>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                  {result.errors.map((e, i) => (
                    <li key={i}>Line {e.line}: {e.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || !text.trim()}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: isPending || !text.trim() ? 0.5 : 1,
            }}
          >
            {isPending ? 'Importing…' : 'Import'}
          </button>
          <button type="button" onClick={reset} disabled={isPending} style={ghostBtn}>
            {result?.successCount ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--foreground)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
