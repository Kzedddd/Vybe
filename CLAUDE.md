# VYBE — Contexte Projet pour Claude

## Pitch
"Sur Shotgun, tu loues ton audience. Sur Vybe, tu la possèdes."
OS de gestion d'événements pour organisateurs de musique underground.

## Stack
- **Framework** : Next.js 14 App Router, TypeScript strict
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Styling** : CSS Variables custom (pas Tailwind utility classes) — design system Luxury Dark Mode
- **Paiements** : Stripe Connect Standard (à venir)
- **Emails** : Resend (à venir)
- **Monorepo** : Turborepo — `apps/web` est la priorité

## Dossier de travail
`D:\Vybee\` — dossier sélectionné dans Cowork

## Dev server
```powershell
cd D:\Vybee\apps\web
npm run dev
```
→ tourne sur **http://localhost:3000**

## Design System
- Fond : `#080808` (--bg-primary)
- Accent : `#b44fff` (--violet)
- Font : Share Tech Mono (monospace)
- **Zéro border-radius** sur les éléments primaires
- Pas de Tailwind utility classes — tout en `style={{}}` inline ou classes CSS custom (`.btn`, `.card`, etc.)
- Fichier de référence : `apps/web/src/app/globals.css`

## Supabase
- Projet : MVP 1.0 — https://tindlgynkdqiucoqfdmz.supabase.co
- Plan : FREE
- 14 tables : profiles, organizers, circles, events, ticket_types, orders, ticket_instances, reviews, team_members, circle_members, participant_scores, organizer_posts, follows, service_providers
- RLS activé sur toutes les tables
- Trigger `handle_new_user` : crée automatiquement un profil `participant` à l'inscription
- 3 clients Supabase :
  - `src/lib/supabase/server.ts` — SSR (Server Components, Server Actions)
  - `src/lib/supabase/client.ts` — Browser (Client Components)
  - `src/lib/supabase/admin.ts` — Service role (jamais côté client)

## Auth
- Supabase Auth avec email/password
- Roles : `participant` (défaut) → `organizer` → `admin`
- Middleware protège : `/my/*`, `/dashboard/*`, `/scanner/*`, `/admin/*`
- Flow inscription → email confirmation → `/auth/callback` → `/auth/onboarding` (si nouveau orga)

## État d'avancement

### ✅ Terminé
- E0 : Design system, clients Supabase, types TypeScript, middleware, migration SQL, emails
- E1 : Auth (login, register, forgot/reset password, callback), Navbar, layout server-side, onboarding organisateur (stepper 4 étapes)
- Migration SQL exécutée dans Supabase ✅
- Fix trigger `handle_new_user` (permissions) ✅
- App fonctionnelle sur localhost:3000 ✅

### 🔜 Prochaine étape — E2
1. Page `/dashboard` — KPIs basiques (événements, billets vendus, revenus)
2. Flow création d'événement — stepper 5 étapes
3. Stripe Connect setup + Checkout integration

### 📋 Backlog
- E3 : Scanner offline (Service Worker + IndexedDB + HMAC QR)
- E5 : Reviews, AIS (score audience), Cercles Privés, Radar Territorial

## Conventions code
- Server Components par défaut, `"use client"` uniquement si nécessaire
- Server Actions dans `actions.ts` avec `"use server"` en tête de fichier
- Validation Zod dans toutes les Server Actions
- `supabase.auth.getUser()` (jamais `getSession()`) dans le middleware
- Pas de `localStorage` pour l'auth

## Commissions
- starter : 5% | pro : 4% | scale : 3%

## AIS (Audience Intelligence Score)
`(attendance_rate × 40) + (MIN(recurrence_count,10) × 5) + (MIN(reviews_count,3) × 5) + (early_bird_ratio × 10)`
Badges : vip_gold / habitue / fiable / a_risque
code D:\Vybee\apps\web\.env.local
