'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  location_name: string | null
  city: string | null
  organizer_name: string
  organizer_id: string
  organizer_genres: string[]
  is_mine: boolean
  status: string
}

interface Props {
  events: CalendarEvent[]
  organizerName: string
  organizerCity: string | null
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS_FR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export default function RadarCalendar({ events, organizerName, organizerCity }: Props) {
  const router = useRouter()
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [cityOnly, setCityOnly] = useState(true)
  const [searchOrga, setSearchOrga] = useState('')
  const [activeGenres, setActiveGenres] = useState<string[]>([])

  // Mini-form state
  const [formDate, setFormDate] = useState<string | null>(null)
  const [formCity, setFormCity] = useState(organizerCity ?? '')
  const [formLineup, setFormLineup] = useState('')
  const [formLieu, setFormLieu] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDay(null)
    setFormDate(null)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDay(null)
    setFormDate(null)
  }

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()

  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7

  // Filtre ville
  const filteredEvents = cityOnly && organizerCity
    ? events.filter(e => e.city?.toLowerCase() === organizerCity.toLowerCase())
    : events

  // Index events par date
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  filteredEvents.forEach(e => {
    const d = new Date(e.starts_at)
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const key = d.getDate().toString()
      if (!eventsByDate[key]) eventsByDate[key] = []
      eventsByDate[key].push(e)
    }
  })

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : []

  const todayStr = now.getFullYear() === currentYear && now.getMonth() === currentMonth
    ? now.getDate().toString()
    : null

  const openForm = (dateStr: string) => {
    setSelectedDay(null)
    setFormDate(dateStr)
    setFormCity(organizerCity ?? '')
    setFormLineup('')
    setFormLieu('')
    setFormError('')
  }

  const closeForm = () => {
    setFormDate(null)
    setFormError('')
  }

  const submitForm = async () => {
    if (!formDate) return
    if (!formCity.trim()) { setFormError('La ville est obligatoire'); return }
    setFormLoading(true)
    setFormError('')
    try {
      const res = await fetch('/api/radar/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: `${formDate}T22:00:00`,
          city: formCity.trim(),
          location_name: formLieu.trim() || null,
          lineup: formLineup.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setFormError(json.error ?? 'Erreur serveur'); return }
      closeForm()
      window.location.reload()
    } catch {
      setFormError('Erreur réseau')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>
          ←
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
          {MONTHS_FR[currentMonth].toUpperCase()} {currentYear}
        </h2>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>
          →
        </button>
      </div>

      {/* Filtre ville */}
      {organizerCity && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FILTRE :</span>
          <button
            onClick={() => setCityOnly(true)}
            style={{
              background: cityOnly ? 'var(--violet)' : 'transparent',
              border: `1px solid ${cityOnly ? 'var(--violet)' : 'var(--border-default)'}`,
              color: cityOnly ? '#fff' : 'var(--text-muted)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '10px',
              letterSpacing: '0.08em',
            }}
          >
            {organizerCity.toUpperCase()} UNIQUEMENT
          </button>
          <button
            onClick={() => setCityOnly(false)}
            style={{
              background: !cityOnly ? 'var(--violet)' : 'transparent',
              border: `1px solid ${!cityOnly ? 'var(--violet)' : 'var(--border-default)'}`,
              color: !cityOnly ? '#fff' : 'var(--text-muted)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '10px',
              letterSpacing: '0.08em',
            }}
          >
            TOUTES LES VILLES
          </button>
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--violet)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MES ÉVÉNEMENTS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', border: '1px dashed var(--violet)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MES BROUILLONS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--border-default)', border: '1px solid var(--text-muted)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>AUTRES ORGANISATEURS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--border-default)' }}>+</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>POSER UNE DATE</span>
        </div>
      </div>

      {/* Grille */}
      <div style={{ border: '1px solid var(--border-default)' }}>
        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' }}>
          {DAYS_FR.map(d => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - startDow + 1
            const isValid = dayNum >= 1 && dayNum <= daysInMonth
            const dayKey = dayNum.toString()
            const dayEvents = isValid ? (eventsByDate[dayKey] ?? []) : []
            const isToday = isValid && dayKey === todayStr
            const isSelected = isValid && dayKey === selectedDay
            const hasEvents = dayEvents.length > 0

            const dateStr = isValid
              ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              : null

            const isFormOpen = formDate === dateStr

            const handleCellClick = () => {
              if (!isValid) return
              setFormDate(null)
              if (hasEvents) {
                setSelectedDay(isSelected ? null : dayKey)
                setSearchOrga('')
                setActiveGenres([])
              } else {
                setSelectedDay(null)
                openForm(dateStr!)
              }
            }

            return (
              <div
                key={i}
                onClick={handleCellClick}
                style={{
                  minHeight: '80px',
                  padding: '8px',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-default)' : 'none',
                  borderBottom: i < totalCells - 7 ? '1px solid var(--border-default)' : 'none',
                  background: isSelected || isFormOpen ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  cursor: isValid ? 'pointer' : 'default',
                  opacity: isValid ? 1 : 0.2,
                  position: 'relative',
                }}
              >
                {isValid && (
                  <>
                    <span style={{
                      fontSize: '11px',
                      color: isToday ? 'var(--violet)' : 'var(--text-muted)',
                      fontWeight: isToday ? 700 : 400,
                      display: 'block',
                      marginBottom: '4px',
                    }}>
                      {dayNum}
                      {isToday && <span style={{ fontSize: '8px', marginLeft: '3px', letterSpacing: '0.1em' }}>●</span>}
                    </span>

                    {!hasEvents && (
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '8px',
                        fontSize: '16px',
                        color: 'var(--border-default)',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}>
                        +
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayEvents.slice(0, 2).map(e => {
                        const isDraft = e.status === 'draft'
                        return (
                          <div
                            key={e.id}
                            style={{
                              background: e.is_mine ? (isDraft ? 'transparent' : 'var(--violet)') : 'var(--bg-secondary)',
                              border: e.is_mine
                                ? (isDraft ? '1px dashed var(--violet)' : 'none')
                                : '1px solid var(--border-default)',
                              padding: '2px 4px',
                              fontSize: '9px',
                              color: e.is_mine ? (isDraft ? 'var(--violet)' : '#fff') : 'var(--text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {isDraft && '◌ '}{e.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mini-formulaire "Poser une date" */}
      {formDate && (
        <div style={{ marginTop: '24px', border: '1px solid var(--violet)', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--violet)' }}>
              + POSER UNE DATE — {formDate.split('-').reverse().join('/')}
            </span>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Organisateur — lecture seule */}
            <div>
              <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ORGANISATEUR
              </label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {organizerName}
              </div>
            </div>

            {/* Date — lecture seule */}
            <div>
              <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                DATE
              </label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {formDate.split('-').reverse().join('/')}
              </div>
            </div>

            {/* Ville — obligatoire */}
            <div>
              <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                VILLE <span style={{ color: 'var(--violet)' }}>*</span>
              </label>
              <input
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
                placeholder="Paris"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Lieu — facultatif */}
            <div>
              <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                LIEU <span style={{ color: 'var(--border-default)' }}>(facultatif)</span>
              </label>
              <input
                value={formLieu}
                onChange={e => setFormLieu(e.target.value)}
                placeholder="Warehouse, Club X..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Line-up — facultatif */}
            <div>
              <label style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                LINE UP <span style={{ color: 'var(--border-default)' }}>(facultatif)</span>
              </label>
              <textarea
                value={formLineup}
                onChange={e => setFormLineup(e.target.value)}
                placeholder="DJ A, DJ B, Live C..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {formError && (
              <p style={{ fontSize: '11px', color: 'var(--danger)' }}>{formError}</p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={submitForm}
                disabled={formLoading}
                style={{
                  background: formLoading ? 'var(--bg-elevated)' : 'var(--violet)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 24px',
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  opacity: formLoading ? 0.5 : 1,
                }}
              >
                {formLoading ? '// ENVOI...' : '> POSER MA DATE'}
              </button>
              <button
                onClick={closeForm}
                style={{ background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)', padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.1em' }}
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Détail du jour sélectionné */}
      {selectedDay && selectedEvents.length > 0 && (() => {
        // Genres disponibles ce jour-là (union de tous les orgas présents)
        const dayGenres = Array.from(new Set(selectedEvents.flatMap(e => e.organizer_genres))).sort()

        // Filtrage
        const visibleEvents = selectedEvents.filter(e => {
          const matchOrga = searchOrga.trim() === '' ||
            e.organizer_name.toLowerCase().includes(searchOrga.toLowerCase())
          const matchGenre = activeGenres.length === 0 ||
            activeGenres.some(g => e.organizer_genres.includes(g))
          return matchOrga && matchGenre
        })

        return (
          <div style={{ marginTop: '24px', border: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
                {selectedDay} {MONTHS_FR[currentMonth].toUpperCase()} — {selectedEvents.length} ÉVÉNEMENT{selectedEvents.length > 1 ? 'S' : ''}
              </span>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>

            {/* Filtres */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Recherche orga */}
              <input
                value={searchOrga}
                onChange={e => setSearchOrga(e.target.value)}
                placeholder="Rechercher un organisateur..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Filtres genre */}
              {dayGenres.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginRight: '4px' }}>GENRE :</span>
                  {dayGenres.map(g => {
                    const active = activeGenres.includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() => setActiveGenres(prev =>
                          active ? prev.filter(x => x !== g) : [...prev, g]
                        )}
                        style={{
                          padding: '3px 10px',
                          fontSize: '9px',
                          letterSpacing: '0.08em',
                          background: active ? 'var(--violet)' : 'transparent',
                          border: `1px solid ${active ? 'var(--violet)' : 'var(--border-default)'}`,
                          color: active ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {g}
                      </button>
                    )
                  })}
                  {activeGenres.length > 0 && (
                    <button
                      onClick={() => setActiveGenres([])}
                      style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                    >
                      effacer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Liste */}
            <div>
              {visibleEvents.length === 0 ? (
                <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Aucun résultat
                </div>
              ) : visibleEvents.map((e, i) => {
                const time = new Date(e.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={e.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < visibleEvents.length - 1 ? '1px solid var(--border-default)' : 'none',
                      borderLeft: `3px solid ${e.is_mine ? 'var(--violet)' : 'var(--border-default)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{e.title}</p>
                          {e.status === 'draft' && (
                            <span style={{ fontSize: '8px', color: 'var(--violet)', border: '1px dashed var(--violet)', padding: '1px 5px', letterSpacing: '0.1em', flexShrink: 0 }}>
                              BROUILLON
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          {time} · {e.city ?? '—'} · {e.location_name ?? '—'} · <span style={{ color: e.is_mine ? 'var(--violet)' : 'var(--text-secondary)' }}>{e.organizer_name}</span>
                        </p>
                        {e.organizer_genres.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {e.organizer_genres.map(g => (
                              <span key={g} style={{ fontSize: '8px', padding: '1px 6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Compteur résultats filtrés */}
            {(searchOrga || activeGenres.length > 0) && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-default)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {visibleEvents.length} / {selectedEvents.length} ÉVÉNEMENTS AFFICHÉS
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
