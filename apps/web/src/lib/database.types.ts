/**
 * VYBE — Database TypeScript Types
 * Generated from Phase 0 validated schema (14 tables + RLS)
 * DO NOT edit manually — regenerate with: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'participant' | 'organizer' | 'admin'

export type OrganizerPlan = 'starter' | 'pro' | 'scale'

export type CredibilityBadge = 'super_orga' | 'orga_verifie' | 'orga_confirme'

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export type EventVisibility = 'public' | 'circle_only'

export type RadarSize = 'small' | 'medium' | 'large'

export type TicketTypeCategory = 'standard' | 'vip' | 'staff' | 'press' | 'guestlist'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'

export type TicketInstanceStatus =
  | 'valid'
  | 'scanned'
  | 'refunded'
  | 'transferred'
  | 'cancelled'

export type TeamRole =
  | 'owner'
  | 'admin'
  | 'finance'
  | 'communication'
  | 'billetterie'
  | 'viewer'

export type CircleAccessType = 'invite_only' | 'request' | 'badge' | 'code'

export type CircleMemberStatus = 'pending' | 'active' | 'removed'

export type AISBadge = 'vip_gold' | 'habitue' | 'fiable' | 'a_risque'

export type PostType =
  | 'announcement'
  | 'teasing'
  | 'lineup'
  | 'behind_scenes'
  | 'recap'

export type ServiceProviderCategory =
  | 'vj_visuals'
  | 'lighting'
  | 'sound'
  | 'decor'
  | 'security'
  | 'photo_video'

// ── Table Row Types ────────────────────────────────────────────────────────────

export interface Profile {
  id: string              // UUID — references auth.users
  role: UserRole
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Organizer {
  id: string
  profile_id: string
  name: string
  slug: string
  city: string
  genres: string[]
  bio: string | null
  logo_url: string | null
  banner_url: string | null
  stripe_account_id: string | null
  stripe_onboarded: boolean
  plan: OrganizerPlan
  commission_rate: number  // e.g. 0.050
  avg_review_score: number | null
  credibility_badge: CredibilityBadge | null
  total_events_count: number
  followers_count: number
  is_verified: boolean
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Circle {
  id: string
  organizer_id: string
  name: string
  description: string | null
  access_type: CircleAccessType
  access_code_hash: string | null
  required_badge: 'vip_gold' | 'habitue' | null
  members_count: number
  is_active: boolean
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string
  circle_id: string | null
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  location_name: string
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  starts_at: string
  ends_at: string | null
  doors_open_at: string | null
  total_capacity: number
  tickets_sold: number
  status: EventStatus
  visibility: EventVisibility
  radar_visible: boolean
  radar_size: RadarSize | null
  created_at: string
  updated_at: string
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  type: TicketTypeCategory
  price: number           // in cents (integer)
  is_free: boolean
  quantity_total: number
  quantity_sold: number
  sale_starts_at: string | null
  sale_ends_at: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  event_id: string
  organizer_id: string
  buyer_id: string | null       // null if guest purchase
  buyer_email: string
  buyer_name: string | null
  is_guest: boolean
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  subtotal_amount: number       // in cents
  commission_amount: number     // in cents
  total_amount: number          // in cents
  status: OrderStatus
  refund_amount: number
  created_at: string
  confirmed_at: string | null
  refunded_at: string | null
}

export interface TicketInstance {
  id: string
  order_id: string
  ticket_type_id: string
  event_id: string
  organizer_id: string
  holder_id: string | null
  holder_email: string
  holder_name: string | null
  qr_hash: string               // HMAC-SHA256 signed
  qr_url: string | null
  status: TicketInstanceStatus
  scanned_at: string | null
  scanned_by: string | null     // profile_id of scanner
  transferred_to_email: string | null
  transferred_at: string | null
  created_at: string
}

export interface Review {
  id: string
  event_id: string
  organizer_id: string
  reviewer_id: string
  ticket_instance_id: string
  score_ambiance: number        // 1-5
  score_organisation: number    // 1-5
  score_musique: number         // 1-5
  score_securite: number        // 1-5
  score_avg: number             // computed: avg of 4 scores
  comment: string | null
  is_visible: boolean
  created_at: string
}

export interface TeamMember {
  id: string
  organizer_id: string
  profile_id: string
  invited_by: string | null
  role: TeamRole
  action_log: Json[]            // [{action, at, by}]
  created_at: string
}

export interface CircleMember {
  id: string
  circle_id: string
  profile_id: string
  invited_by: string | null
  status: CircleMemberStatus
  joined_at: string
}

export interface ParticipantScore {
  id: string
  organizer_id: string
  participant_id: string
  score: number                 // 0-100
  badge: AISBadge
  attendance_rate: number       // 0-1
  recurrence_count: number
  reviews_count: number
  early_bird_ratio: number      // 0-1
  last_event_at: string | null
  last_calculated_at: string
}

export interface OrganizerPost {
  id: string
  organizer_id: string
  event_id: string | null
  type: PostType
  content: string
  media_urls: string[]
  is_published: boolean
  created_at: string
}

export interface Follow {
  follower_id: string
  organizer_id: string
  created_at: string
}

export interface ServiceProvider {
  id: string
  name: string
  category: ServiceProviderCategory
  city: string
  bio: string | null
  portfolio_urls: string[]
  contact_email: string | null
  price_range: string | null    // e.g. "200-500€"
  is_verified: boolean
  is_active: boolean
  created_at: string
}

// ── Database Type (for Supabase client typing) ─────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id'>>
      }
      organizers: {
        Row: Organizer
        Insert: Omit<Organizer, 'id' | 'created_at' | 'updated_at' | 'total_events_count' | 'followers_count'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Organizer, 'id'>>
      }
      circles: {
        Row: Circle
        Insert: Omit<Circle, 'id' | 'created_at' | 'members_count'> & {
          id?: string
          created_at?: string
          members_count?: number
        }
        Update: Partial<Omit<Circle, 'id'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'tickets_sold'> & {
          id?: string
          created_at?: string
          updated_at?: string
          tickets_sold?: number
        }
        Update: Partial<Omit<Event, 'id'>>
      }
      ticket_types: {
        Row: TicketType
        Insert: Omit<TicketType, 'id' | 'created_at' | 'quantity_sold'> & {
          id?: string
          created_at?: string
          quantity_sold?: number
        }
        Update: Partial<Omit<TicketType, 'id'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Order, 'id'>>
      }
      ticket_instances: {
        Row: TicketInstance
        Insert: Omit<TicketInstance, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<TicketInstance, 'id'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'score_avg'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Review, 'id' | 'score_avg'>>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<TeamMember, 'id'>>
      }
      circle_members: {
        Row: CircleMember
        Insert: Omit<CircleMember, 'id' | 'joined_at'> & {
          id?: string
          joined_at?: string
        }
        Update: Partial<Omit<CircleMember, 'id'>>
      }
      participant_scores: {
        Row: ParticipantScore
        Insert: Omit<ParticipantScore, 'id' | 'last_calculated_at'> & {
          id?: string
          last_calculated_at?: string
        }
        Update: Partial<Omit<ParticipantScore, 'id'>>
      }
      organizer_posts: {
        Row: OrganizerPost
        Insert: Omit<OrganizerPost, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<OrganizerPost, 'id'>>
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'created_at'> & { created_at?: string }
        Update: Partial<Follow>
      }
      service_providers: {
        Row: ServiceProvider
        Insert: Omit<ServiceProvider, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ServiceProvider, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Utility Types ──────────────────────────────────────────────────────────────

/** Event with organizer joined */
export interface EventWithOrganizer extends Event {
  organizer: Pick<Organizer, 'id' | 'name' | 'slug' | 'logo_url' | 'credibility_badge' | 'is_verified'>
}

/** Event with organizer + ticket types */
export interface EventFull extends EventWithOrganizer {
  ticket_types: TicketType[]
}

/** Order with ticket instances */
export interface OrderWithTickets extends Order {
  ticket_instances: TicketInstance[]
  event: Pick<Event, 'id' | 'title' | 'slug' | 'starts_at' | 'location_name' | 'cover_url'>
}

/** Dashboard KPIs */
export interface DashboardKPIs {
  total_revenue: number       // in cents
  tickets_sold: number
  attendee_count: number      // actual scans
  avg_review_score: number | null
  upcoming_events: number
  total_followers: number
}

/** AIS score calculation input */
export interface AISInput {
  organizer_id: string
  participant_id: string
  total_tickets_bought: number
  total_attended: number        // scanned
  reviews_count: number
  early_bird_tickets: number
  last_event_at: string | null
}
