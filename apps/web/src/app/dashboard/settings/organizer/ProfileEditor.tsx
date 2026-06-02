"use client"

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const GENRES = [
  "Techno", "House", "Drum & Bass", "Jungle", "Electro",
  "Ambient", "Industrial", "EBM", "Rave", "Hard Techno",
  "Deep House", "Minimal", "Trance", "Hardcore", "Breakbeat",
  "Experimental", "Noise", "Dark Electro",
]

const CITIES = [
  "Paris", "Marseille", "Lyon", "Bordeaux", "Toulouse",
  "Nantes", "Lille", "Strasbourg", "Casablanca", "Rabat",
  "Amsterdam", "Berlin", "Bruxelles", "Barcelone", "Londres",
  "Autre",
]

interface MediaItem {
  type: 'photo' | 'video'
  url: string
  caption?: string
  created_at?: string
}

interface Organizer {
  id: string
  name: string
  slug: string
  city: string | null
  genres: string[] | null
  bio: string | null
  logo_url: string | null
  banner_url: string | null
  media: MediaItem[] | null
  badge: string | null
}

export default function ProfileEditor({ organizer, userId }: { organizer: Organizer; userId: string }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [bio, setBio] = useState(organizer.bio ?? '')
  const [city, setCity] = useState(organizer.city ?? '')
  const [genres, setGenres] = useState<string[]>(organizer.genres ?? [])
  const [logoUrl, setLogoUrl] = useState(organizer.logo_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(organizer.banner_url ?? '')
  const [media, setMedia] = useState<MediaItem[]>(organizer.media ?? [])

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [newCaption, setNewCaption] = useState('')

  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)

  // ── Upload helpers ──────────────────────────────────────────────────────────

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const { error } = await supabase.storage
      .from('organizers')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) { setError(error.message); return null }

    const { data } = supabase.storage.from('organizers').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const url = await uploadFile(file, `${organizer.id}/logo.${file.name.split('.').pop()}`)
    if (url) setLogoUrl(url)
    setUploadingLogo(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const url = await uploadFile(file, `${organizer.id}/banner.${file.name.split('.').pop()}`)
    if (url) setBannerUrl(url)
    setUploadingBanner(false)
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploadingMedia(true)
    const newItems: MediaItem[] = []
    for (const file of files) {
      const isVideo = file.type.startsWith('video/')
      const ext = file.name.split('.').pop()
      const ts = Date.now()
      const url = await uploadFile(file, `${organizer.id}/media/${ts}.${ext}`)
      if (url) {
        newItems.push({
          type: isVideo ? 'video' : 'photo',
          url,
          caption: newCaption || undefined,
          created_at: new Date().toISOString(),
        })
      }
    }
    setMedia(prev => [...newItems, ...prev])
    setNewCaption('')
    setUploadingMedia(false)
  }

  function removeMedia(idx: number) {
    setMedia(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('organizers')
      .update({
        bio: bio || null,
        city: city || null,
        genres: genres.length > 0 ? genres : null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        media,
      })
      .eq('id', organizer.id)

    setSaving(false)
    if (error) { setError(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleGenre = (g: string) => {
    setGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  return (
    <div>
      {error && (
        <div style={{ border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', fontSize: '11px', marginBottom: '24px' }}>
          ⚠ {error}
        </div>
      )}
      {saved && (
        <div style={{ border: '1px solid var(--success)', color: 'var(--success)', padding: '12px 16px', fontSize: '11px', marginBottom: '24px' }}>
          ✓ Profil mis à jour
        </div>
      )}

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <Section label="BANNIÈRE">
        <div
          style={{
            width: '100%',
            height: '160px',
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 50%, #0f0f0f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px dashed var(--border-default)',
            position: 'relative',
            marginBottom: '12px',
          }}
          onClick={() => bannerRef.current?.click()}
        >
          {uploadingBanner ? (
            <span style={{ fontSize: '11px', color: 'var(--violet)', letterSpacing: '0.1em' }}>UPLOAD EN COURS...</span>
          ) : (
            <span style={{
              fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
              background: 'rgba(0,0,0,0.6)', padding: '6px 14px',
            }}>
              {bannerUrl ? '✎ MODIFIER LA BANNIÈRE' : '+ AJOUTER UNE BANNIÈRE'}
            </span>
          )}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Recommandé : 1400×400px. JPG ou PNG.</p>
      </Section>

      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <Section label="LOGO / PHOTO DE PROFIL">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px', height: '80px', flexShrink: 0,
              background: logoUrl
                ? `url(${logoUrl}) center/cover no-repeat`
                : 'var(--bg-elevated)',
              border: '1px dashed var(--border-default)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', color: 'var(--violet)',
            }}
            onClick={() => logoRef.current?.click()}
          >
            {!logoUrl && organizer.name[0].toUpperCase()}
          </div>
          <div>
            <button
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="btn btn-ghost btn-sm"
            >
              {uploadingLogo ? 'UPLOAD...' : logoUrl ? '✎ CHANGER' : '+ UPLOADER'}
            </button>
            {logoUrl && (
              <button
                onClick={() => setLogoUrl('')}
                style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em' }}
              >
                SUPPRIMER
              </button>
            )}
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>Carré, min. 200×200px.</p>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
      </Section>

      {/* ── Bio ────────────────────────────────────────────────────────────── */}
      <Section label="BIO">
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Parle de ton collectif, ton univers musical, ton histoire..."
          style={{
            width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', fontFamily: "'Share Tech Mono', monospace",
            fontSize: '12px', lineHeight: 1.7, padding: '12px', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
          {bio.length}/500
        </p>
      </Section>

      {/* ── Ville ──────────────────────────────────────────────────────────── */}
      <Section label="VILLE">
        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
            color: city ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: "'Share Tech Mono', monospace", fontSize: '12px',
            padding: '10px 12px', width: '100%', cursor: 'pointer',
          }}
        >
          <option value="">— Sélectionner —</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Section>

      {/* ── Genres ─────────────────────────────────────────────────────────── */}
      <Section label="GENRES MUSICAUX">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {GENRES.map(g => {
            const active = genres.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                style={{
                  padding: '5px 12px',
                  border: `1px solid ${active ? 'var(--violet)' : 'var(--border-default)'}`,
                  background: active ? 'rgba(180,79,255,0.12)' : 'transparent',
                  color: active ? 'var(--violet)' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '10px', letterSpacing: '0.1em',
                }}
              >
                {g}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Médias ─────────────────────────────────────────────────────────── */}
      <Section label="GALERIE MÉDIAS (PHOTOS & VIDÉOS)">
        {/* Upload */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            placeholder="Légende (optionnel)"
            style={{
              width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontFamily: "'Share Tech Mono', monospace",
              fontSize: '11px', padding: '8px 12px', marginBottom: '8px', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => mediaRef.current?.click()}
            disabled={uploadingMedia}
            className="btn btn-ghost btn-sm"
          >
            {uploadingMedia ? 'UPLOAD EN COURS...' : '+ AJOUTER PHOTO / VIDÉO'}
          </button>
          <input
            ref={mediaRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleMediaUpload}
          />
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Photos JPG/PNG/WEBP — Vidéos MP4/MOV (max ~50 MB). Plusieurs fichiers acceptés.
          </p>
        </div>

        {/* Grid */}
        {media.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border-default)', color: 'var(--text-muted)', fontSize: '12px' }}>
            Aucun média — ajoute des photos ou vidéos de tes soirées
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {media.map((item, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: `url(${item.url}) center/cover no-repeat` }} />
                )}
                {/* Type badge */}
                <div style={{
                  position: 'absolute', top: '6px', left: '6px',
                  fontSize: '8px', letterSpacing: '0.1em',
                  background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px',
                }}>
                  {item.type === 'video' ? '▶ VIDEO' : '◼ PHOTO'}
                </div>
                {/* Caption */}
                {item.caption && (
                  <div style={{
                    position: 'absolute', bottom: '24px', left: 0, right: 0,
                    fontSize: '9px', color: '#fff', padding: '0 6px',
                    background: 'rgba(0,0,0,0.5)', textAlign: 'center',
                  }}>
                    {item.caption}
                  </div>
                )}
                {/* Delete */}
                <button
                  onClick={() => removeMedia(i)}
                  style={{
                    position: 'absolute', bottom: '4px', right: '4px',
                    background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff',
                    cursor: 'pointer', fontSize: '10px', padding: '2px 6px',
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'SAUVEGARDE...' : '> SAUVEGARDER LE PROFIL'}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', paddingBottom: '12px', borderBottom: '1px solid var(--border-default)', marginBottom: '20px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
