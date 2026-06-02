import { z } from "zod";

// User Profiles
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  auth_id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(500).nullable(),
  location: z.string().max(100).nullable(),
  website: z.string().url().nullable(),
  followers_count: z.number().int().non_negative(),
  following_count: z.number().int().non_negative(),
  events_attended: z.number().int().non_negative(),
  reviews_written: z.number().int().non_negative(),
  badge_level: z.enum([
    "newcomer",
    "regular",
    "fan",
    "critic",
    "pioneer",
    "vip",
  ]),
  is_organizer: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// Events
export const EventSchema = z.object({
  id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string(),
  category: z.string(),
  date_time: z.string().datetime(),
  end_date_time: z.string().datetime().nullable(),
  location: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  image_url: z.string().url().nullable(),
  capacity: z.number().int().positive(),
  sold_tickets: z.number().int().non_negative(),
  avg_rating: z.number().min(0).max(5).nullable(),
  reviews_count: z.number().int().non_negative(),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  is_featured: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Event = z.infer<typeof EventSchema>;

// Ticket Types
export const TicketTypeSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string().max(100),
  description: z.string().nullable(),
  price: z.number().non_negative(),
  quantity: z.number().int().positive(),
  quantity_sold: z.number().int().non_negative(),
  features: z.array(z.string()),
  is_available: z.boolean(),
  created_at: z.string().datetime(),
});

export type TicketType = z.infer<typeof TicketTypeSchema>;

// Orders
export const OrderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_id: z.string().uuid(),
  total_price: z.number().non_negative(),
  ticket_count: z.number().int().positive(),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  stripe_payment_intent_id: z.string().nullable(),
  payment_method: z.string(),
  qr_code: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;

// Reviews
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000),
  created_at: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;

// Follows
export const FollowSchema = z.object({
  id: z.string().uuid(),
  follower_id: z.string().uuid(),
  following_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Follow = z.infer<typeof FollowSchema>;

// Posts (Social Feed)
export const PostSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_id: z.string().uuid().nullable(),
  content: z.string().max(3000),
  image_url: z.string().url().nullable(),
  likes_count: z.number().int().non_negative(),
  comments_count: z.number().int().non_negative(),
  is_pinned: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Post = z.infer<typeof PostSchema>;

// Post Comments
export const PostCommentSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().max(500),
  likes_count: z.number().int().non_negative(),
  created_at: z.string().datetime(),
});

export type PostComment = z.infer<typeof PostCommentSchema>;

// Post Likes
export const PostLikeSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type PostLike = z.infer<typeof PostLikeSchema>;

// Groups/Communities
export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string(),
  image_url: z.string().url().nullable(),
  creator_id: z.string().uuid(),
  members_count: z.number().int().positive(),
  is_private: z.boolean(),
  created_at: z.string().datetime(),
});

export type Group = z.infer<typeof GroupSchema>;

// Group Members
export const GroupMemberSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["member", "moderator", "admin"]),
  joined_at: z.string().datetime(),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

// Group Events
export const GroupEventSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  event_id: z.string().uuid(),
  added_by: z.string().uuid(),
  added_at: z.string().datetime(),
});

export type GroupEvent = z.infer<typeof GroupEventSchema>;

// Fan Clubs
export const FanClubSchema = z.object({
  id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  name: z.string().max(100),
  description: z.string(),
  image_url: z.string().url().nullable(),
  members_count: z.number().int().non_negative(),
  tier: z.enum(["free", "basic", "premium"]),
  monthly_price: z.number().non_negative().nullable(),
  created_at: z.string().datetime(),
});

export type FanClub = z.infer<typeof FanClubSchema>;

// Fan Club Members
export const FanClubMemberSchema = z.object({
  id: z.string().uuid(),
  fan_club_id: z.string().uuid(),
  user_id: z.string().uuid(),
  tier: z.string(),
  joined_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
});

export type FanClubMember = z.infer<typeof FanClubMemberSchema>;

// Rideshares
export const RideshareSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  departure_location: z.string(),
  destination: z.string(),
  departure_time: z.string().datetime(),
  available_seats: z.number().int().positive(),
  taken_seats: z.number().int().non_negative(),
  price_per_seat: z.number().non_negative(),
  notes: z.string().nullable(),
  status: z.enum(["active", "full", "cancelled", "completed"]),
  created_at: z.string().datetime(),
});

export type Rideshare = z.infer<typeof RideshareSchema>;

// Rideshare Passengers
export const RidesharePassengerSchema = z.object({
  id: z.string().uuid(),
  rideshare_id: z.string().uuid(),
  passenger_id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  joined_at: z.string().datetime(),
});

export type RidesharePassenger = z.infer<typeof RidesharePassengerSchema>;

// Lost & Found Items
export const LostItemSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  reported_by: z.string().uuid(),
  item_name: z.string(),
  description: z.string(),
  image_url: z.string().url().nullable(),
  location_found: z.string(),
  date_lost: z.string().date(),
  category: z.string(),
  status: z.enum(["lost", "found", "returned"]),
  claimed_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export type LostItem = z.infer<typeof LostItemSchema>;

// Staff Listings
export const StaffListingSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  position: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  pay_rate: z.number().non_negative().nullable(),
  positions_available: z.number().int().positive(),
  applications_received: z.number().int().non_negative(),
  status: z.enum(["open", "closed", "filled"]),
  created_at: z.string().datetime(),
});

export type StaffListing = z.infer<typeof StaffListingSchema>;

// Staff Applications
export const StaffApplicationSchema = z.object({
  id: z.string().uuid(),
  staff_listing_id: z.string().uuid(),
  applicant_id: z.string().uuid(),
  cover_letter: z.string(),
  availability: z.array(z.string()),
  experience: z.string(),
  status: z.enum(["pending", "accepted", "rejected", "withdrew"]),
  applied_at: z.string().datetime(),
});

export type StaffApplication = z.infer<typeof StaffApplicationSchema>;

// Resale Listings
export const ResaleListingSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  event_id: z.string().uuid(),
  ticket_count: z.number().int().positive(),
  price_per_ticket: z.number().non_negative(),
  status: z.enum(["active", "sold", "cancelled"]),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});

export type ResaleListing = z.infer<typeof ResaleListingSchema>;

// Notifications
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum([
    "order_confirmation",
    "event_reminder",
    "comment_reply",
    "new_follower",
    "group_invite",
    "resale_available",
  ]),
  title: z.string(),
  message: z.string(),
  related_id: z.string().uuid().nullable(),
  is_read: z.boolean(),
  created_at: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Creator Profiles
export const CreatorProfileSchema = z.object({
  id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  bio: z.string(),
  verified: z.boolean(),
  events_created: z.number().int().non_negative(),
  total_attendees: z.number().int().non_negative(),
  rating: z.number().min(0).max(5).nullable(),
  banner_image_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
});

export type CreatorProfile = z.infer<typeof CreatorProfileSchema>;

// Creator Recommendations
export const CreatorRecommendationSchema = z.object({
  id: z.string().uuid(),
  creator_id: z.string().uuid(),
  recommended_by: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  created_at: z.string().datetime(),
});

export type CreatorRecommendation = z.infer<typeof CreatorRecommendationSchema>;

// Event Albums (Photo galleries)
export const EventAlbumSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string(),
  created_by: z.string().uuid(),
  photos_count: z.number().int().non_negative(),
  created_at: z.string().datetime(),
});

export type EventAlbum = z.infer<typeof EventAlbumSchema>;

// Album Photos
export const AlbumPhotoSchema = z.object({
  id: z.string().uuid(),
  album_id: z.string().uuid(),
  image_url: z.string().url(),
  uploaded_by: z.string().uuid(),
  caption: z.string().nullable(),
  uploaded_at: z.string().datetime(),
});

export type AlbumPhoto = z.infer<typeof AlbumPhotoSchema>;
