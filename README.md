# Vybe - Event Ticketing Platform

A modern event ticketing platform with integrated social network features. Built with Next.js 14, Expo/React Native, and Supabase.

## Project Structure

```
vybe/
├── apps/
│   ├── web/           # Next.js 14 web application
│   └── mobile/        # Expo React Native mobile app
├── packages/
│   └── shared/        # Shared TypeScript types and utilities
├── supabase/
│   └── migrations/    # Database migrations
├── turbo.json         # Turborepo configuration
└── package.json       # Root workspace configuration
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm or npm
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install
# or pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local

# Start development servers
npm run dev
```

## Features

### Event Ticketing
- Browse and discover events
- Purchase tickets with Stripe
- QR code ticket generation and scanning
- Resale marketplace
- Event search and filtering

### Social Network
- User profiles with social following
- Feed/posts with comments and likes
- Groups and communities
- Fan clubs for event organizers
- Follower/following relationships

### Additional Features
- User reviews and ratings
- Organizer tools and dashboards
- Staff management
- Rideshare coordination
- Lost & found
- Image galleries and albums
- Real-time notifications

## Technology Stack

### Web (Next.js 14)
- TypeScript (strict mode)
- Tailwind CSS
- Supabase (Auth, Database, Storage, Realtime)
- Stripe for payments
- Resend for emails
- Cloudinary for images

### Mobile (Expo)
- Expo SDK 51
- Expo Router for navigation
- NativeWind for Tailwind styling
- Zustand for state management

### Database
- PostgreSQL (via Supabase)
- Row Level Security
- Automated triggers

## Development

### Start development servers
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Lint code
```bash
npm run lint
```

### Type check
```bash
npm run type-check
```

## Database

Database migrations are located in `supabase/migrations/`. Apply migrations using the Supabase CLI:

```bash
supabase migration up
```

## Deployment

- **Web**: Deploy to Vercel
- **Mobile**: Build APK/IPA via Expo
- **Database**: Managed via Supabase

## License

MIT
