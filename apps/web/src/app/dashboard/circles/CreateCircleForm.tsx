'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateCircleForm({ organizerId }: { organizerId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/circles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur serveur'); setLoading(false); return }
    router.push(`/dashboard/circles/${json.id}`)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--violet)',
          border: 'none',
          color: '#fff',
          padding: '12px 28px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '11px',
          letterSpacing: '0.12em',
        }}
      >
        + CRÉER UN CERCLE
      </button>
    )
  }

  return (
    <div style={{ border: '1px solid var(--violet)', background: 'var(--bg-secondary)', padding: '24px' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--violet)', marginBottom: '20px' }}>
        + NOUVEAU CERCLE
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            NOM DU CERCLE <span style={{ color: 'var(--violet)' }}>*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="VIP Night, Crew intime, Family..."
            autoFocus
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            DESCRIPTION <span style={{ color: 'var(--border-default)' }}>(facultatif)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décris ce cercle en quelques mots..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>

        {error && <p style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: loading ? 'var(--bg-elevated)' : 'var(--violet)',
              border: 'none', color: '#fff', padding: '10px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.1em', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '// CRÉATION...' : '> CRÉER'}
          </button>
          <button
            onClick={() => { setOpen(false); setName(''); setDescription(''); setError('') }}
            style={{
              background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
              padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.1em',
            }}
          >
            ANNULER
          </button>
        </div>
      </div>
    </div>
  )
}
