'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  ticketTypeId: string
  isFree: boolean
  eventSlug: string
}

export default function BuyTicketButton({ ticketTypeId, isFree, eventSlug }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleBuy = async () => {
    setLoading(true)
    setError('')

    try {
      if (isFree) {
        // Billet gratuit — enregistrement direct (à implémenter)
        router.push(`/events/${eventSlug}/success?free=true`)
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_type_id: ticketTypeId, quantity: 1 }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erreur lors du paiement')
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
        onClick={handleBuy}
        disabled={loading}
        className="btn btn-primary btn-sm"
        style={{ width: '100%' }}
      >
        {loading ? 'CHARGEMENT...' : isFree ? 'RÉSERVER GRATUITEMENT →' : 'ACHETER →'}
      </button>
      {error && (
        <p style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '6px', letterSpacing: '0.05em' }}>
          ▸ {error}
        </p>
      )}
    </div>
  )
}
