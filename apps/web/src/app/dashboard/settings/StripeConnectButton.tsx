'use client'

import { useState } from 'react'

export default function StripeConnectButton({ isOnboarded }: { isOnboarded: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erreur lors de la connexion Stripe')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={isOnboarded ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
      >
        {loading
          ? 'CHARGEMENT...'
          : isOnboarded
          ? 'TABLEAU DE BORD STRIPE →'
          : 'CONNECTER STRIPE →'}
      </button>
      {error && (
        <p style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '8px', letterSpacing: '0.05em' }}>
          ▸ {error}
        </p>
      )}
    </div>
  )
}
