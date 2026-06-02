"use client"

import { useState } from 'react'

export default function BadgesClient({ organizerId }: { organizerId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const recalculate = async () => {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/badges/calculate-regularity', { method: 'POST' })
    const json = await res.json()
    setLoading(false)
    if (json.success) {
      setMsg(`✓ ${json.badges?.length ?? 0} badge(s) régularité recalculé(s)`)
      setTimeout(() => { setMsg(''); window.location.reload() }, 1500)
    } else {
      setMsg(`⚠ ${json.error}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
      <button
        onClick={recalculate}
        disabled={loading}
        className="btn btn-ghost btn-sm"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'CALCUL...' : '↺ RECALCULER RÉGULARITÉ'}
      </button>
      {msg && (
        <span style={{ fontSize: '10px', color: msg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', letterSpacing: '0.05em' }}>
          {msg}
        </span>
      )}
    </div>
  )
}
