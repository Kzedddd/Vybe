'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  eventId: string
  eventSlug: string
}

const CRITERIA = [
  { key: 'rating_programmation', label: 'Programmation', description: 'Qualité du line-up, cohérence artistique', poids: '25%' },
  { key: 'rating_son_scene', label: 'Son & scène', description: 'Qualité audio, visuel, espace de danse', poids: '25%' },
  { key: 'rating_organisation', label: 'Organisation', description: 'Accueil, fluidité entrée, cloakroom, bar', poids: '20%' },
  { key: 'rating_ambiance', label: 'Ambiance', description: 'Crowd, énergie générale, sécurité ressentie', poids: '20%' },
  { key: 'rating_qualite_prix', label: 'Rapport qualité/prix', description: 'Ticket + consommations vs expérience', poids: '10%' },
]

function StarRating({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: `${size}px`,
            color: star <= display ? 'var(--violet)' : 'var(--border-default)',
            transition: 'color 0.1s', padding: '2px',
          }}
        >★</button>
      ))}
    </div>
  )
}

export default function ReviewForm({ eventId, eventSlug }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showCriteria, setShowCriteria] = useState(false)
  const [criteria, setCriteria] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const LABELS = ['', 'MAUVAIS', 'PASSABLE', 'BIEN', 'TRÈS BIEN', 'EXCELLENT']

  const handleSubmit = async () => {
    if (rating === 0) { setError('Sélectionne une note globale'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          rating,
          comment: comment || undefined,
          ...Object.fromEntries(Object.entries(criteria).filter(([, v]) => v > 0)),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la soumission'); return }
      router.push(`/events/${eventSlug}?review=success`)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '32px' }}>
      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>
        NOTE TON EXPÉRIENCE
      </p>

      {/* Note globale */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          NOTE GLOBALE <span style={{ color: 'var(--violet)' }}>*</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StarRating value={rating} onChange={setRating} size={32} />
          {rating > 0 && (
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              {LABELS[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Critères détaillés */}
      <div style={{ marginBottom: '24px', marginTop: '24px' }}>
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
            CRITÈRES DÉTAILLÉS (OPTIONNEL)
          </span>
          <span style={{ fontSize: '10px', color: 'var(--violet)', transition: 'transform 0.2s', display: 'inline-block', transform: showCriteria ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▸
          </span>
        </button>

        {showCriteria && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {CRITERIA.map((c) => (
              <div key={c.key} style={{ padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{c.label}</p>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{c.poids}</span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.description}</p>
                <StarRating
                  value={criteria[c.key] ?? 0}
                  onChange={(v) => setCriteria(prev => ({ ...prev, [c.key]: v }))}
                  size={20}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commentaire */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          COMMENTAIRE (OPTIONNEL)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder="Décris ton expérience..."
          rows={3}
          style={{
            width: '100%', background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', padding: '12px',
            fontSize: '13px', fontFamily: 'inherit',
            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
          {comment.length}/500
        </p>
      </div>

      {/* Mention confidentialité */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '12px', marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          🔒 Ta review est anonyme — seul ton prénom et initiale du nom seront visibles (ex: "Thomas B.").
          Tes coordonnées complètes ne sont jamais partagées.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', letterSpacing: '0.05em' }}>
          ▸ {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="btn btn-primary btn-sm"
        style={{ width: '100%' }}
      >
        {loading ? 'ENVOI...' : 'SOUMETTRE MA REVIEW →'}
      </button>
    </div>
  )
}
