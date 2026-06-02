'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notif {
  id: string
  type: string
  title: string
  body: string | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const unread = notifs.filter(n => !n.read_at).length

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, action_url, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setNotifs(data as Notif[])
    }
    load()

    // Realtime — nouvelles notifs
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifs(prev => [payload.new as Notif, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const handleNotifClick = async (n: Notif) => {
    if (!n.read_at) await markRead(n.id)
    setOpen(false)
    if (n.action_url) router.push(n.action_url)
  }

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read_at).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'transparent', border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)', padding: '6px 10px',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ◎
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--violet)', color: '#fff',
            fontSize: '8px', width: '14px', height: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            letterSpacing: 0,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            width: '320px', zIndex: 200, maxHeight: '420px', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header dropdown */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                NOTIFICATIONS {unread > 0 && `— ${unread} NON LU${unread > 1 ? 'ES' : 'E'}`}
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', color: 'var(--violet)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '9px', letterSpacing: '0.08em' }}
                >
                  TOUT LIRE
                </button>
              )}
            </div>

            {/* Liste */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Aucune notification
                </div>
              ) : notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    cursor: n.action_url ? 'pointer' : 'default',
                    background: n.read_at ? 'transparent' : 'var(--bg-secondary)',
                    borderLeft: n.read_at ? '3px solid transparent' : '3px solid var(--violet)',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '4px' }}>
                      {n.body}
                    </p>
                  )}
                  <p style={{ fontSize: '9px', color: 'var(--border-default)', letterSpacing: '0.05em' }}>
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
