-- Vybe Complete Database Schema
-- This file contains the complete PostgreSQL schema for the Vybe event ticketing platform

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE profile_badge_level AS ENUM (
  'newcomer',
  'regular',
  'fan',
  'critic',
  'pioneer',
  'vip'
);

CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'admin');

CREATE TYPE fan_club_tier AS ENUM ('free', 'basic', 'premium');

CREATE TYPE rideshare_status AS ENUM ('active', 'full', 'cancelled', 'completed');

CREATE TYPE rideshare_passenger_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TYPE lost_item_status AS ENUM ('lost', 'found', 'returned');

CREATE TYPE staff_listing_status AS ENUM ('open', 'closed', 'filled');

CREATE TYPE staff_application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrew');

CREATE TYPE resale_listing_status AS ENUM ('active', 'sold', 'cancelled');

CREATE TYPE notification_type AS ENUM (
  'order_confirmation',
  'event_reminder',
  'comment_reply',
  'new_follower',
  'group_invite',
  'resale_available'
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Profiles (User Profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  website TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
  following_count INTEGER NOT NULL DEFAULT 0 CHECK (following_count >= 0),
  events_attended INTEGER NOT NULL DEFAULT 0 CHECK (events_attended >= 0),
  reviews_written INTEGER NOT NULL DEFAULT 0 CHECK (reviews_written >= 0),
  badge_level profile_badge_level NOT NULL DEFAULT 'newcomer',
  is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT username_length CHECK (CHAR_LENGTH(username) >= 3)
);

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_auth_id ON public.profiles(auth_id);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  sold_tickets INTEGER NOT NULL DEFAULT 0 CHECK (sold_tickets >= 0),
  avg_rating DECIMAL(3, 2) CHECK (avg_rating >= 0 AND avg_rating <= 5),
  reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  status event_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT title_length CHECK (CHAR_LENGTH(title) >= 3)
);

CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_date_time ON public.events(date_time);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_category ON public.events(category);

-- Ticket Types
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (quantity_sold <= quantity)
);

CREATE INDEX idx_ticket_types_event_id ON public.ticket_types(event_id);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  ticket_count INTEGER NOT NULL CHECK (ticket_count > 0),
  status order_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_event_id ON public.orders(event_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Follows (Social Following)
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Posts (Social Feed)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT content_length CHECK (CHAR_LENGTH(content) <= 3000)
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_event_id ON public.posts(event_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- Post Comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT content_length CHECK (CHAR_LENGTH(content) <= 500)
);

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);

-- Post Likes
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Groups (Communities)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  members_count INTEGER NOT NULL DEFAULT 1 CHECK (members_count > 0),
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX idx_groups_name ON public.groups(name);

-- Group Members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- Group Events
CREATE TABLE public.group_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, event_id)
);

CREATE INDEX idx_group_events_group_id ON public.group_events(group_id);
CREATE INDEX idx_group_events_event_id ON public.group_events(event_id);

-- Fan Clubs
CREATE TABLE public.fan_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  members_count INTEGER NOT NULL DEFAULT 0 CHECK (members_count >= 0),
  tier fan_club_tier NOT NULL DEFAULT 'free',
  monthly_price DECIMAL(10, 2) CHECK (monthly_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fan_clubs_organizer_id ON public.fan_clubs(organizer_id);

-- Fan Club Members
CREATE TABLE public.fan_club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fan_club_id UUID NOT NULL REFERENCES public.fan_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(fan_club_id, user_id)
);

CREATE INDEX idx_fan_club_members_fan_club_id ON public.fan_club_members(fan_club_id);
CREATE INDEX idx_fan_club_members_user_id ON public.fan_club_members(user_id);

-- Rideshares
CREATE TABLE public.rideshares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  departure_location VARCHAR(500) NOT NULL,
  destination VARCHAR(500) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  taken_seats INTEGER NOT NULL DEFAULT 0 CHECK (taken_seats >= 0),
  price_per_seat DECIMAL(10, 2) NOT NULL CHECK (price_per_seat >= 0),
  notes TEXT,
  status rideshare_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (taken_seats <= available_seats)
);

CREATE INDEX idx_rideshares_event_id ON public.rideshares(event_id);
CREATE INDEX idx_rideshares_driver_id ON public.rideshares(driver_id);
CREATE INDEX idx_rideshares_status ON public.rideshares(status);

-- Rideshare Passengers
CREATE TABLE public.rideshare_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rideshare_id UUID NOT NULL REFERENCES public.rideshares(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status rideshare_passenger_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rideshare_id, passenger_id)
);

CREATE INDEX idx_rideshare_passengers_rideshare_id ON public.rideshare_passengers(rideshare_id);
CREATE INDEX idx_rideshare_passengers_passenger_id ON public.rideshare_passengers(passenger_id);

-- Lost & Found Items
CREATE TABLE public.lost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  location_found VARCHAR(500) NOT NULL,
  date_lost DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  status lost_item_status NOT NULL DEFAULT 'lost',
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lost_items_event_id ON public.lost_items(event_id);
CREATE INDEX idx_lost_items_reported_by ON public.lost_items(reported_by);
CREATE INDEX idx_lost_items_status ON public.lost_items(status);

-- Staff Listings
CREATE TABLE public.staff_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
  pay_rate DECIMAL(10, 2) CHECK (pay_rate >= 0),
  positions_available INTEGER NOT NULL CHECK (positions_available > 0),
  applications_received INTEGER NOT NULL DEFAULT 0 CHECK (applications_received >= 0),
  status staff_listing_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_listings_event_id ON public.staff_listings(event_id);
CREATE INDEX idx_staff_listings_status ON public.staff_listings(status);

-- Staff Applications
CREATE TABLE public.staff_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_listing_id UUID NOT NULL REFERENCES public.staff_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  availability TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience TEXT NOT NULL,
  status staff_application_status NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_listing_id, applicant_id)
);

CREATE INDEX idx_staff_applications_staff_listing_id ON public.staff_applications(staff_listing_id);
CREATE INDEX idx_staff_applications_applicant_id ON public.staff_applications(applicant_id);
CREATE INDEX idx_staff_applications_status ON public.staff_applications(status);

-- Resale Listings
CREATE TABLE public.resale_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_count INTEGER NOT NULL CHECK (ticket_count > 0),
  price_per_ticket DECIMAL(10, 2) NOT NULL CHECK (price_per_ticket >= 0),
  status resale_listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_resale_listings_seller_id ON public.resale_listings(seller_id);
CREATE INDEX idx_resale_listings_event_id ON public.resale_listings(event_id);
CREATE INDEX idx_resale_listings_status ON public.resale_listings(status);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Creator Profiles
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  events_created INTEGER NOT NULL DEFAULT 0 CHECK (events_created >= 0),
  total_attendees INTEGER NOT NULL DEFAULT 0 CHECK (total_attendees >= 0),
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  banner_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_creator_profiles_organizer_id ON public.creator_profiles(organizer_id);

-- Creator Recommendations
CREATE TABLE public.creator_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  recommended_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creator_id, recommended_by)
);

CREATE INDEX idx_creator_recommendations_creator_id ON public.creator_recommendations(creator_id);

-- Event Albums (Photo Galleries)
CREATE TABLE public.event_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photos_count INTEGER NOT NULL DEFAULT 0 CHECK (photos_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_albums_event_id ON public.event_albums(event_id);

-- Album Photos
CREATE TABLE public.album_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.event_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_album_photos_album_id ON public.album_photos(album_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rideshares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rideshare_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Events RLS
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid()::uuid);

CREATE POLICY "Organizers can update their events" ON public.events
  FOR UPDATE USING (organizer_id = auth.uid()::uuid);

CREATE POLICY "Organizers can insert events" ON public.events
  FOR INSERT WITH CHECK (organizer_id = auth.uid()::uuid);

-- Orders RLS
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Posts RLS
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, username)
  VALUES (
    new.id,
    new.email,
    'user_' || RIGHT(new.id::text, 8)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update event avg_rating on review insert/update
CREATE OR REPLACE FUNCTION public.update_event_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET
    avg_rating = (
      SELECT AVG(rating)::DECIMAL(3, 2)
      FROM public.reviews
      WHERE event_id = NEW.event_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE event_id = NEW.event_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_update_event_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_event_rating();

-- Function to update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_count_update
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_like_count_update
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comment_count_update
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Function to update group members count
CREATE OR REPLACE FUNCTION public.update_group_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET members_count = members_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_member_count_update
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_members_count();

-- Function to update fan club members count
CREATE OR REPLACE FUNCTION public.update_fan_club_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.fan_clubs SET members_count = members_count + 1 WHERE id = NEW.fan_club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.fan_clubs SET members_count = GREATEST(members_count - 1, 0) WHERE id = NEW.fan_club_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fan_club_member_count_update
  AFTER INSERT OR DELETE ON public.fan_club_members
  FOR EACH ROW EXECUTE FUNCTION public.update_fan_club_members_count();

-- Function to update badge levels based on activity
CREATE OR REPLACE FUNCTION public.update_badge_level()
RETURNS TRIGGER AS $$
DECLARE
  v_events_attended INTEGER;
  v_reviews_written INTEGER;
BEGIN
  SELECT events_attended, reviews_written INTO v_events_attended, v_reviews_written
  FROM public.profiles
  WHERE id = NEW.id;

  UPDATE public.profiles
  SET badge_level = CASE
    WHEN v_reviews_written >= 50 AND v_events_attended >= 50 THEN 'critic'::profile_badge_level
    WHEN v_events_attended >= 100 THEN 'pioneer'::profile_badge_level
    WHEN v_reviews_written >= 20 AND v_events_attended >= 30 THEN 'critic'::profile_badge_level
    WHEN v_events_attended >= 20 THEN 'fan'::profile_badge_level
    WHEN v_events_attended >= 5 THEN 'regular'::profile_badge_level
    ELSE 'newcomer'::profile_badge_level
  END
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_badge
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_badge_level();

-- Update event sold tickets when order is completed
CREATE OR REPLACE FUNCTION public.update_event_sold_tickets()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.events
    SET sold_tickets = sold_tickets + NEW.ticket_count
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_update_event_sold_tickets
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_event_sold_tickets();

-- Update album photos count
CREATE OR REPLACE FUNCTION public.update_album_photos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.event_albums SET photos_count = photos_count + 1 WHERE id = NEW.album_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.event_albums SET photos_count = GREATEST(photos_count - 1, 0) WHERE id = OLD.album_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER album_photo_count_update
  AFTER INSERT OR DELETE ON public.album_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_album_photos_count();

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_posts_is_pinned ON public.posts(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_events_sold_tickets ON public.events(sold_tickets DESC);
CREATE INDEX idx_profiles_badge_level ON public.profiles(badge_level);
CREATE INDEX idx_events_is_featured ON public.events(is_featured) WHERE is_featured = TRUE;
