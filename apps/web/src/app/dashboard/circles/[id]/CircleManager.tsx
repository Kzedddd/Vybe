'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Member {
  id: string
  profile_id: string
  full_name: string | null
  email: string
  joined_at: string
}

interface Buyer {
  id: string
  full_name: string | null
  email: string
}

interface Circle {
  id: string
  name: string
  description: string | null
  invite_token: string
  members_count: number
  is_active: boolean
}

export default function CircleManager({
  circle,
  members,
  buyers,
  organizerName,
  inviteLink,
}: {
  circle: Circle
  members: Member[]
  buyers: Buyer[]
  organizerName: string
  inviteLink: string
}) {

  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'membres' | 'inviter'>('membres')
  const [selectedBuyers, setSelectedBuyers] = useState<Set<string>>(new Set())
  const [searchBuyer, setSearchBuyer] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: number; errors: number } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleBuyer = (id: string) => {
    setSelectedBuyers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    const visible = filteredBuyers.map(b => b.id)
    setSelectedBuyers(new Set(visible))
  }

  const sendInvites = async () => {
    if (selectedBuyers.size === 0) return
    setSending(true)
    setSendResult(null)
    const res = await fetch(`/api/circles/${circle.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileIds: Array.from(selectedBuyers) }),
    })
    const json = await res.json()
    setSendResult(json)
    setSending(false)
    setSelectedBuyers(new Set())
  }

  const removeMember = async (memberId: string) => {
    setRemovingId(memberId)
    await fetch(`/api/circles/${circle.id}/members/${memberId}`, { method: 'DELETE' })
    setRemovingId(null)
    window.location.reload()
  }

  const filteredBuyers = buyers.filter(b =>
    searchBuyer.trim() === '' ||
    b.email.toLowerCase().includes(searchBuyer.toLowerCase()) ||
    (b.full_name ?? '').toLowerCase().includes(searchBuyer.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.05em' }}>
            ◈ {circle.name.toUpperCase()}
          </h1>
          <span style={{
            fontSize: '9px', padding: '2px 8px', letterSpacing: '0.1em',
            background: circle.is_active ? 'transparent' : 'var(--bg-elevated)',
            border: `1px solid ${circle.is_active ? 'var(--success)' : 'var(--border-default)'}`,
            color: circle.is_active ? 'var(--success)' : 'var(--text-muted)',
          }}>
            {circle.is_active ? 'ACTIF' : 'INACTIF'}
          </span>
        </div>
        {circle.description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{circle.description}</p>
        )}
      </div>

      {/* Lien d'invitation */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px 24px', marginBottom: '32px' }}>
        <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          LIEN D'INVITATION
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{
            flex: 1, minWidth: 0, padding: '10px 14px',
            background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
            fontSize: '11px', color: 'var(--violet)', letterSpacing: '0.04em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
          }}>
            {inviteLink}
          </code>
          <button
            onClick={copyLink}
            style={{
              background: copied ? 'var(--success)' : 'var(--violet)',
              border: 'none', color: '#fff', padding: '10px 20px',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px',
              letterSpacing: '0.1em', flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ COPIÉ' : 'COPIER'}
          </button>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Partage ce lien par DM, WhatsApp, story... Toute personne qui clique rejoint ton cercle.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-default)', marginBottom: '32px' }}>
        {[
          { label: 'MEMBRES', value: circle.members_count },
          { label: 'INVITABLES', value: buyers.length },
          { label: 'ACCÈS', value: 'INVITATION' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-secondary)', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', color: 'var(--violet)', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
        {(['membres', 'inviter'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', padding: '12px 24px',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: tab === t ? 'var(--violet)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--violet)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'membres' ? `MEMBRES (${members.length})` : `INVITER (${buyers.length} acheteurs)`}
          </button>
        ))}
      </div>

      {/* Tab — Membres */}
      {tab === 'membres' && (
        <div>
          {members.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Aucun membre encore — partage le lien d'invitation ou invite tes acheteurs
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-default)' }}>
              {members.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 20px', background: 'var(--bg-secondary)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {m.full_name ?? m.email}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {m.email} · rejoint le {new Date(m.joined_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={removingId === m.id}
                    style={{
                      background: 'none', border: '1px solid var(--border-default)',
                      color: 'var(--danger)', padding: '6px 14px',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '9px', letterSpacing: '0.1em',
                      opacity: removingId === m.id ? 0.5 : 1,
                    }}
                  >
                    RETIRER
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab — Inviter */}
      {tab === 'inviter' && (
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Ces personnes ont déjà acheté un billet à l'un de tes événements.
            Sélectionne celles à qui envoyer une invitation par email.
          </p>

          {buyers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Aucun acheteur éligible — tous sont déjà membres ou tu n'as pas encore de billets vendus
              </p>
            </div>
          ) : (
            <>
              {/* Barre recherche + sélection */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  value={searchBuyer}
                  onChange={e => setSearchBuyer(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  style={{
                    flex: 1, minWidth: '200px', padding: '8px 14px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '11px', outline: 'none',
                  }}
                />
                <button
                  onClick={selectAll}
                  style={{
                    background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
                    padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', letterSpacing: '0.08em',
                  }}
                >
                  TOUT SÉLECTIONNER ({filteredBuyers.length})
                </button>
                <button
                  onClick={() => setSelectedBuyers(new Set())}
                  style={{
                    background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
                    padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', letterSpacing: '0.08em',
                  }}
                >
                  DÉSÉLECTIONNER
                </button>
              </div>

              {/* Liste acheteurs */}
              <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border-default)', marginBottom: '20px' }}>
                {filteredBuyers.map((b, i) => {
                  const selected = selectedBuyers.has(b.id)
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBuyer(b.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '12px 16px', cursor: 'pointer',
                        background: selected ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                        borderBottom: i < filteredBuyers.length - 1 ? '1px solid var(--border-default)' : 'none',
                        borderLeft: selected ? '3px solid var(--violet)' : '3px solid transparent',
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', flexShrink: 0,
                        border: `1px solid ${selected ? 'var(--violet)' : 'var(--border-default)'}`,
                        background: selected ? 'var(--violet)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', color: '#fff',
                      }}>
                        {selected && '✓'}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '1px' }}>
                          {b.full_name ?? b.email}
                        </p>
                        {b.full_name && (
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.email}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Résultat envoi */}
              {sendResult && (
                <div style={{
                  padding: '12px 16px', marginBottom: '16px',
                  background: 'var(--bg-secondary)', border: `1px solid ${sendResult.errors > 0 ? 'var(--warning)' : 'var(--success)'}`,
                  fontSize: '11px', color: sendResult.errors > 0 ? 'var(--warning)' : 'var(--success)',
                }}>
                  ✓ {sendResult.success} invitation{sendResult.success > 1 ? 's' : ''} envoyée{sendResult.success > 1 ? 's' : ''}
                  {sendResult.errors > 0 && ` — ${sendResult.errors} échec(s)`}
                </div>
              )}

              {/* Bouton envoyer */}
              <button
                onClick={sendInvites}
                disabled={sending || selectedBuyers.size === 0}
                style={{
                  background: selectedBuyers.size === 0 ? 'var(--bg-elevated)' : 'var(--violet)',
                  border: 'none', color: '#fff', padding: '12px 28px',
                  cursor: selectedBuyers.size === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.12em',
                  opacity: sending || selectedBuyers.size === 0 ? 0.5 : 1,
                }}
              >
                {sending
                  ? '// ENVOI EN COURS...'
                  : selectedBuyers.size === 0
                    ? 'SÉLECTIONNE DES DESTINATAIRES'
                    : `> ENVOYER ${selectedBuyers.size} INVITATION${selectedBuyers.size > 1 ? 'S' : ''}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
