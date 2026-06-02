'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  starts_at: string
  location_name: string | null
  tickets_sold: number | null
  total_capacity: number | null
}

interface ScanResult {
  valid: boolean
  reason: string
  code: string
  holder?: string
  ticket_type?: string
}

export default function ScannerClient({ event }: { event: Event }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastScannedRef = useRef<string>('')
  const cooldownRef = useRef<boolean>(false)

  const [result, setResult] = useState<ScanResult | null>(null)
  const [scannedCount, setScannedCount] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // Démarrer la caméra
  useEffect(() => {
    let stream: MediaStream | null = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsScanning(true)
          scanLoop()
        }
      } catch {
        setCameraError('Impossible d\'accéder à la caméra. Vérifie les permissions.')
      }
    }

    startCamera()

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const scanLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      animRef.current = requestAnimationFrame(scanLoop)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    try {
      // Utiliser BarcodeDetector si disponible (Chrome/Android)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        detector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue
            handleQRCode(value)
          }
        })
      }
    } catch {
      // BarcodeDetector non supporté
    }

    animRef.current = requestAnimationFrame(scanLoop)
  }, [])

  const handleQRCode = useCallback(async (value: string) => {
    // Éviter les doublons en moins de 3 secondes
    if (cooldownRef.current || lastScannedRef.current === value) return
    lastScannedRef.current = value
    cooldownRef.current = true

    try {
      const res = await fetch('/api/scanner/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_hash: value, event_id: event.id }),
      })
      const data: ScanResult = await res.json()
      setResult(data)
      if (data.valid) setScannedCount(c => c + 1)
    } catch {
      setResult({ valid: false, reason: 'ERREUR RÉSEAU', code: 'network_error' })
    }

    // Cooldown 3 secondes avant prochain scan
    setTimeout(() => {
      cooldownRef.current = false
      lastScannedRef.current = ''
      setResult(null)
    }, 3000)
  }, [event.id])

  const resultColor = result
    ? result.valid
      ? 'var(--success)'
      : result.code === 'already_used'
      ? 'var(--warning)'
      : 'var(--danger)'
    : 'transparent'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '2px' }}>SCANNER ACTIF</p>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>{event.title}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>SCANNÉS</p>
            <p style={{ fontSize: '20px', color: 'var(--violet)', fontWeight: 400 }}>{scannedCount}</p>
          </div>
          <Link href="/scanner" style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            ← QUITTER
          </Link>
        </div>
      </div>

      {/* Caméra */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
        {cameraError ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '16px' }}>📷</p>
              <p style={{ fontSize: '12px', color: 'var(--danger)', letterSpacing: '0.05em' }}>{cameraError}</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Viseur */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: '220px', height: '220px',
                border: `2px solid ${result ? resultColor : 'rgba(255,255,255,0.6)'}`,
                boxShadow: result ? `0 0 20px ${resultColor}40` : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}>
                {/* Coins */}
                {[
                  { top: -2, left: -2, borderTop: '3px solid', borderLeft: '3px solid' },
                  { top: -2, right: -2, borderTop: '3px solid', borderRight: '3px solid' },
                  { bottom: -2, left: -2, borderBottom: '3px solid', borderLeft: '3px solid' },
                  { bottom: -2, right: -2, borderBottom: '3px solid', borderRight: '3px solid' },
                ].map((style, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: '20px', height: '20px',
                    borderColor: result ? resultColor : 'var(--violet)',
                    ...style,
                  }} />
                ))}
              </div>
            </div>

            {/* Résultat overlay */}
            {result && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: `${resultColor}15`,
                borderTop: `2px solid ${resultColor}`,
                padding: '20px 24px',
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{ fontSize: '18px', color: resultColor, letterSpacing: '0.1em', fontWeight: 400, marginBottom: '4px' }}>
                  {result.valid ? '✓ ' : '✗ '}{result.reason}
                </p>
                {result.holder && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {result.holder}{result.ticket_type ? ` — ${result.ticket_type}` : ''}
                  </p>
                )}
              </div>
            )}

            {/* Instruction */}
            {!result && isScanning && (
              <div style={{
                position: 'absolute', bottom: '24px', left: 0, right: 0,
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                  PLACE LE QR CODE DANS LE CADRE
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
