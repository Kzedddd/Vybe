export interface Event {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string;
  status: string;
  location_name: string;
  date_start: string;
  date_end: string | null;
  capacity: number | null;
  tickets_sold: number;
  avg_rating: number;
  review_count: number;
  min_price_cents: number;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_organizer: boolean;
  reputation: number;
  badge_level: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  event_id: string;
  quantity: number;
  total_paid_cents: number;
  qr_code: string;
  status: string;
  checked_in: boolean;
}

export interface Review {
  id: string;
  author_id: string;
  event_id: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price_cents: number;
  quantity_total: number;
  quantity_sold: number;
}
