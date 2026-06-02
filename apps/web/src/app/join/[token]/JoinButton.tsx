'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinButton({ circleId, token }: { circleId: string; token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const join = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/circles/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur'); setLoading(false); return }
    router.push('/events?joined=1')
  }

  return (
    <div>
      {error && <p style={{ fontSize: '11px', color: 'var(--danger)', marginBottom: '12px' }}>{error}</p>}
      <button
        onClick={join}
        disabled={loading}
        style={{
          background: loading ? 'var(--bg-elevated)' : 'var(--violet)',
          border: 'none', color: '#fff', padding: '14px 36px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.15em',
          opacity: loading ? 0.6 : 1, width: '100%',
        }}
      >
        {loading ? '// CONNEXION...' : '> REJOINDRE LE CERCLE'}
      </button>
    </div>
  )
}
