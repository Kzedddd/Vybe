// ── Badge definitions ─────────────────────────────────────────────────────────

export interface BadgeDef {
  type: string
  label: string
  desc: string
  icon: string
  color: string      // text/icon color
  bg: string         // background
  border: string     // border color
  category: 'event' | 'regularity'
  criteria: string
}

export const BADGE_DEFS: Record<string, BadgeDef> = {
  // ── Badges par événement ──────────────────────────────────────────────────
  super_orga: {
    type: 'super_orga',
    label: 'Super Orga',
    desc: 'Score global exceptionnel',
    icon: '★',
    color: '#000',
    bg: '#FFD700',
    border: '#FFD700',
    category: 'event',
    criteria: 'Score global ≥ 4.5/5 · minimum 15 avis',
  },
  excellence_programmation: {
    type: 'excellence_programmation',
    label: 'Excellence programmation',
    desc: 'Lineup au sommet',
    icon: '★',
    color: '#fff',
    bg: '#b44fff',
    border: '#b44fff',
    category: 'event',
    criteria: 'Note Programmation = 5/5 · minimum 10 avis',
  },
  son_exception: {
    type: 'son_exception',
    label: "Son d'exception",
    desc: 'Qualité son & scène remarquable',
    icon: '★',
    color: '#000',
    bg: '#22c55e',
    border: '#22c55e',
    category: 'event',
    criteria: 'Note Son & scène ≥ 4.8/5 · minimum 10 avis',
  },
  orga_irreprochable: {
    type: 'orga_irreprochable',
    label: 'Orga irréprochable',
    desc: 'Organisation sans faille',
    icon: '★',
    color: '#000',
    bg: '#22c55e',
    border: '#22c55e',
    category: 'event',
    criteria: 'Note Organisation ≥ 4.7/5 · minimum 10 avis',
  },

  // ── Badges régularité ─────────────────────────────────────────────────────
  reference_scene: {
    type: 'reference_scene',
    label: 'Référence de la scène',
    desc: 'Excellence constante sur 3 events',
    icon: '◆',
    color: '#000',
    bg: '#FFD700',
    border: '#FFD700',
    category: 'regularity',
    criteria: 'Score ≥ 4.5 sur 3 événements consécutifs',
  },
  en_progression: {
    type: 'en_progression',
    label: 'En progression',
    desc: 'Amélioration continue',
    icon: '◆',
    color: '#fff',
    bg: '#22c55e',
    border: '#22c55e',
    category: 'regularity',
    criteria: 'Score +0.3 sur les 3 derniers évts',
  },
  legende_vybe: {
    type: 'legende_vybe',
    label: 'Légende Vybe',
    desc: 'Le sommet de la plateforme',
    icon: '◆',
    color: '#fff',
    bg: '#b44fff',
    border: '#b44fff',
    category: 'regularity',
    criteria: 'Score ≥ 4.7 sur 5 événements dans l\'année',
  },
}

export const EVENT_BADGES   = Object.values(BADGE_DEFS).filter(b => b.category === 'event')
export const REGULAR_BADGES = Object.values(BADGE_DEFS).filter(b => b.category === 'regularity')
