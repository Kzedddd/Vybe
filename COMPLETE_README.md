# Vybe - Event Ticketing & Social Platform

Vybe is a comprehensive event ticketing platform with integrated social networking, community building, and event coordination features. Built with modern technologies including Next.js 14, Expo, Supabase, and Stripe.

## Application Structure

### Core Features

#### Events & Ticketing
- **Event Listings**: Browse, search, and filter events by category, price, and date
- **Event Details**: View complete event information, reviews, ticket options, and organizer details
- **Ticket Purchase**: Secure checkout flow powered by Stripe
- **Event Management**: Organizers can create, edit, and manage their events
- **Analytics Dashboard**: Organizers track event performance and ticket sales

#### Social Features
- **Social Feed**: Create and share posts, like and comment on posts
- **User Profiles**: View user profiles, follow other users, and build social connections
- **Groups/Communities**: Create and manage communities around shared interests
- **Fan Clubs**: Exclusive memberships by creators with recurring subscription model

#### Event Coordination
- **Rideshares**: Find rides to/from events or offer rideshare opportunities
- **Lost & Found**: Post and search for lost items at events
- **Staff Opportunities**: Event organizers post staff positions; attendees apply for jobs
- **Event Albums**: Photos and memories from events

#### User Management
- **Authentication**: Secure signup/login with Supabase Auth
- **Notifications**: Real-time notifications for follows, orders, and event updates
- **Settings**: User preferences, privacy controls, and security features
- **Dashboard**: Personalized hub with user statistics and activity

### Technology Stack

**Frontend (Web)**
- Next.js 14 (App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS with custom violet theme
- Lucide React icons

**Frontend (Mobile)**
- Expo SDK 51
- React Native
- Expo Router for file-based navigation
- NativeWind for Tailwind styling
- Zustand for state management

**Backend & Infrastructure**
- Supabase (PostgreSQL, Auth, Real-time)
- Next.js API Routes
- Stripe for payments
- Resend for email
- Cloudinary for images

**Development**
- Turborepo for monorepo management
- TypeScript across all packages
- Zod for schema validation

## Project Structure

```
vybee/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                  # Next.js app router pages
│   │   │   │   ├── api/              # API routes (webhooks, CRUD)
│   │   │   │   ├── auth/             # Authentication pages
│   │   │   │   ├── events/           # Event pages
│   │   │   │   ├── explore/          # Event discovery with filtering
│   │   │   │   ├── organizer/        # Organizer management
│   │   │   │   ├── feed/             # Social feed
│   │   │   │   ├── dashboard/        # User dashboard
│   │   │   │   ├── profile/          # User profiles
│   │   │   │   ├── groups/           # Community management
│   │   │   │   ├── fan-clubs/        # Fan club features
│   │   │   │   ├── rideshares/       # Rideshare coordination
│   │   │   │   ├── lost-found/       # Lost & found
│   │   │   │   ├── staff/            # Staff job listings
│   │   │   │   ├── resale/           # Ticket resale marketplace
│   │   │   │   ├── checkout/         # Stripe payment flow
│   │   │   │   ├── notifications/    # User notifications
│   │   │   │   └── layout.tsx        # Root layout with Navbar
│   │   │   ├── components/           # React components
│   │   │   │   └── layout/           # Layout components (Navbar)
│   │   │   ├── lib/                  # Libraries & clients
│   │   │   │   ├── supabase-client.ts
│   │   │   │   └── stripe.ts
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   │   └── useAuth.ts        # Auth state management
│   │   │   ├── utils/                # Utility functions
│   │   │   │   ├── date.ts           # Date formatting
│   │   │   │   └── format.ts         # String/number formatting
│   │   │   └── globals.css           # Global styling & component classes
│   │   └── [config files]            # Next.js configs
│   │
│   └── mobile/                       # Expo React Native app
│       ├── src/
│       │   ├── app/                  # Expo Router file-based navigation
│       │   │   ├── (tabs)/           # Tab navigation screens
│       │   │   ├── auth/             # Auth flow
│       │   │   ├── event/            # Event details screen
│       │   │   └── store/            # Zustand state stores
│       │   ├── _layout.tsx           # Root navigation config
│       │   └── app.json              # Expo config
│       └── [config files]            # Babel, NativeWind configs
│
├── packages/
│   └── shared/                       # Shared TypeScript types & utilities
│       ├── src/
│       │   ├── types.ts              # 24 Zod schemas for all entities
│       │   ├── supabase.ts           # Supabase client factory
│       │   ├── api.ts                # Axios HTTP client wrapper
│       │   ├── index.ts              # Exports
│       │   └── utils/                # Shared utilities
│       └── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_full_schema.sql       # Complete database schema
│
├── package.json                      # Workspace root
├── turbo.json                        # Turborepo configuration
├── tsconfig.json                     # Root TypeScript config
├── .prettierrc                       # Code formatting rules
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

## Database Schema

### Core Tables (25+ total)

**User Management**
- `profiles`: User profiles with badges, stats, and creator status
- `follows`: User follow relationships
- `notifications`: User notifications with type and status

**Events & Ticketing**
- `events`: Event information with status and metrics
- `ticket_types`: Ticket options for events
- `orders`: Purchase records with payment info
- `reviews`: Event reviews and ratings

**Social Features**
- `posts`: Social media posts
- `post_comments`: Comments on posts
- `post_likes`: Like interactions

**Communities**
- `groups`: Public/private communities
- `group_members`: Group membership with roles
- `group_events`: Events associated with groups

**Monetization**
- `fan_clubs`: Creator-owned subscription communities
- `fan_club_members`: Fan club subscriptions
- `resale_listings`: Ticket resale marketplace

**Event Coordination**
- `rideshares`: Rideshare offerings
- `rideshare_passengers`: Passenger bookings
- `lost_items`: Lost & found items
- `staff_listings`: Job postings
- `staff_applications`: Job applications
- `event_albums`: Photo albums
- `album_photos`: Photos in albums

**Creator Features**
- `creator_profiles`: Creator-specific info
- `creator_recommendations`: Personalized recommendations

### Security & Automation

**Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only view/modify their own data
- Public data (events, profiles) visible to all
- Admin features protected by role checks

**Automated Triggers**
- Auto-create user profile on signup
- Update event ratings on review changes
- Track follower/following counts
- Calculate post engagement metrics
- Auto-assign user badge levels based on activity
- Update ticket sold counts on orders

**Custom Types**
- `profile_badge_level`: newcomer → pioneer
- `event_status`: draft → published → completed
- `order_status`: pending → completed → refunded
- `group_member_role`: admin, moderator, member
- And 8+ more domain-specific types

## API Routes

### Authentication
- `POST /api/auth/sign-up`: Register new user
- `POST /api/auth/sign-in`: Login user
- `POST /api/auth/sign-out`: Logout user

### Events
- `POST /api/events`: Create event (organizer only)
- `GET /api/events`: List events
- `PUT /api/events/:id`: Update event (organizer only)

### Orders & Payments
- `POST /api/orders`: Create order with Stripe
- `POST /api/webhooks/stripe`: Handle payment events
- `PUT /api/orders/:id`: Update order status

### Social
- `GET /api/posts`: Fetch posts (with filtering)
- `POST /api/posts`: Create post
- `POST /api/likes`: Toggle like on post
- `GET /api/comments?post_id=...`: Fetch post comments
- `POST /api/comments`: Create comment

### Community
- `GET /api/groups`: List groups
- `POST /api/groups`: Create group
- `POST /api/groups/members`: Join/leave group
- `POST /api/follows`: Follow/unfollow user

### Features
- `GET /api/reviews`: Fetch reviews
- `POST /api/reviews`: Create/update review
- `GET /api/notifications`: Fetch user notifications
- `POST /api/notifications`: Mark as read
- `POST /api/rideshares/passengers`: Book rideshare seat

## Environment Variables

### Web App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXTAUTH_SECRET=...
```

### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm or npm
- Supabase project
- Stripe account
- Resend account (for emails)
- Cloudinary account (for images)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone [repo]
   cd vybee
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   # Fill in actual values
   ```

3. **Set up Supabase**
   ```bash
   # Run migrations
   pnpm supabase:migrate
   # Or manually run SQL from supabase/migrations/001_full_schema.sql
   ```

4. **Run locally**
   ```bash
   # Web development
   pnpm dev:web
   
   # Mobile development
   pnpm dev:mobile
   
   # Both (in separate terminals)
   pnpm dev
   ```

### Development Workflow

**Building**
```bash
pnpm build          # Build all packages
pnpm build:web      # Build web only
pnpm build:mobile   # Build mobile only
```

**Type Checking**
```bash
pnpm type-check     # Check types across monorepo
```

**Linting**
```bash
pnpm lint           # Lint all packages
```

**Development**
```bash
pnpm dev            # Start all dev servers
pnpm dev:web        # Start Next.js dev server (localhost:3000)
pnpm dev:mobile     # Start Expo dev server
```

## Key Features Implementation

### Payment Flow
1. User clicks "Buy Tickets"
2. Redirects to checkout page with pre-populated amount
3. Stripe Elements form collects payment
4. Successful payment creates order and calls webhook
5. Webhook updates order status to "completed"

### Authentication
1. User registers with email/password
2. Supabase creates auth account
3. Trigger auto-creates profile in `profiles` table
4. useAuth hook manages state across app

### Social Features
1. Users create posts on feed
2. Other users can like/comment
3. Triggers auto-update engagement counts
4. Notifications sent for interactions (configured but requires subscription)

### Event Discovery
- Category filtering
- Price range filtering
- Text search across title/location/description
- Sort by date, popularity, or rating
- Real-time filters on /explore page

## Deployment

**Web (Vercel)**
```bash
vercel deploy
# Auto-deploys from main branch
```

**Mobile (Expo)**
```bash
eas build --platform ios
eas build --platform android
# Or use Expo Go for immediate testing
```

## Code Standards

- TypeScript strict mode throughout
- Zod for runtime validation
- Component-based architecture
- Server/Client component separation (Next.js)
- Reusable utilities in @vybe/shared
- Consistent naming conventions
- Comprehensive error handling

## Performance Considerations

- Images served through Cloudinary CDN
- Database queries optimized with indexes
- RLS policies enable secure row filtering
- Real-time subscriptions available
- Mobile app screens optimized for performance

## Future Enhancements

- [ ] Real-time chat between users
- [ ] Advanced recommendation engine
- [ ] Video uploads for event promotion
- [ ] Mobile payment integration with Apple/Google Pay
- [ ] In-app messaging for organizers
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Accessibility improvements
- [ ] Offline support for mobile
- [ ] Dark mode theme

## Support

For issues or questions, refer to:
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Expo docs: https://docs.expo.dev
- Stripe docs: https://stripe.com/docs

## License

[Your license here]

---

**Built with ❤️ by the Vybe Team**
