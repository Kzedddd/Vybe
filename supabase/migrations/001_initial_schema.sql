-- ══════════════════════════════════════════════════════════════════════════════
-- VYBE — Initial Schema Migration
-- Version : 001
-- Tables  : 14 (profiles, organizers, circles, events, ticket_types, orders,
--           ticket_instances, reviews, team_members, circle_members,
--           participant_scores, organizer_posts, follows, service_providers)
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ════════════════════════════════════════════════
-- TABLE 1 : profiles
-- Auto-created on Supabase Auth user creation
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'participant'
                CHECK (role IN ('participant', 'organizer', 'admin')),
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'participant')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════
-- TABLE 2 : organizers
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  city                TEXT NOT NULL,
  genres              TEXT[] NOT NULL DEFAULT '{}',
  bio                 TEXT,
  logo_url            TEXT,
  banner_url          TEXT,
  stripe_account_id   TEXT UNIQUE,
  stripe_onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
  plan                TEXT NOT NULL DEFAULT 'starter'
                        CHECK (plan IN ('starter', 'pro', 'scale')),
  commission_rate     NUMERIC(4,3) NOT NULL DEFAULT 0.050,
  avg_review_score    NUMERIC(3,2),
  credibility_badge   TEXT
                        CHECK (credibility_badge IN (
                          'super_orga', 'orga_verifie', 'orga_confirme'
                        )),
  total_events_count  INTEGER NOT NULL DEFAULT 0,
  followers_count     INTEGER NOT NULL DEFAULT 0,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizers_slug ON organizers(slug);
CREATE INDEX IF NOT EXISTS idx_organizers_city ON organizers(city);
CREATE INDEX IF NOT EXISTS idx_organizers_plan ON organizers(plan);

CREATE TRIGGER organizers_updated_at
  BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════
-- TABLE 3 : circles (avant events pour la FK)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS circles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id      UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  access_type       TEXT NOT NULL DEFAULT 'invite_only'
                      CHECK (access_type IN (
                        'invite_only', 'request', 'badge', 'code'
                      )),
  access_code_hash  TEXT,
  required_badge    TEXT
                      CHECK (required_badge IN ('vip_gold', 'habitue')),
  members_count     INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circles_organizer_id ON circles(organizer_id);

-- ════════════════════════════════════════════════
-- TABLE 4 : events
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id      UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  circle_id         UUID REFERENCES circles(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  cover_url         TEXT,
  location_name     TEXT NOT NULL,
  location_address  TEXT,
  location_lat      NUMERIC(9,6),
  location_lng      NUMERIC(9,6),
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  doors_open_at     TIMESTAMPTZ,
  total_capacity    INTEGER NOT NULL,
  tickets_sold      INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN (
                        'draft', 'published', 'cancelled', 'completed'
                      )),
  visibility        TEXT NOT NULL DEFAULT 'public'
                      CHECK (visibility IN ('public', 'circle_only')),
  radar_visible     BOOLEAN NOT NULL DEFAULT TRUE,
  radar_size        TEXT CHECK (radar_size IN ('small', 'medium', 'large')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organizer_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id    ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_starts_at       ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_visibility      ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm      ON events USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_city_starts     ON events(location_name, starts_at)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_organizer_upcoming ON events(organizer_id, starts_at)
  WHERE status IN ('published', 'draft');

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════
-- TABLE 5 : ticket_types
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ticket_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'standard'
                    CHECK (type IN (
                      'standard', 'vip', 'staff', 'press', 'guestlist'
                    )),
  price           INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),   -- in cents
  is_free         BOOLEAN NOT NULL DEFAULT FALSE,
  quantity_total  INTEGER NOT NULL,
  quantity_sold   INTEGER NOT NULL DEFAULT 0,
  sale_starts_at  TIMESTAMPTZ,
  sale_ends_at    TIMESTAMPTZ,
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);

-- ════════════════════════════════════════════════
-- TABLE 6 : orders
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id                    UUID NOT NULL REFERENCES events(id),
  organizer_id                UUID NOT NULL REFERENCES organizers(id),
  buyer_id                    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_email                 TEXT NOT NULL,
  buyer_name                  TEXT,
  is_guest                    BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_checkout_session_id  TEXT UNIQUE,
  stripe_payment_intent_id    TEXT UNIQUE,
  subtotal_amount             INTEGER NOT NULL,   -- in cents
  commission_amount           INTEGER NOT NULL,   -- in cents
  total_amount                INTEGER NOT NULL,   -- in cents
  status                      TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                  'pending', 'confirmed',
                                  'refunded', 'partially_refunded', 'cancelled'
                                )),
  refund_amount               INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at                TIMESTAMPTZ,
  refunded_at                 TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_event_id     ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_organizer_id ON orders(organizer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id     ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email  ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);

-- ════════════════════════════════════════════════
-- TABLE 7 : ticket_instances
-- One row per billet (1 order = N ticket_instances)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ticket_instances (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  ticket_type_id        UUID NOT NULL REFERENCES ticket_types(id),
  event_id              UUID NOT NULL REFERENCES events(id),
  organizer_id          UUID NOT NULL REFERENCES organizers(id),
  holder_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  holder_email          TEXT NOT NULL,
  holder_name           TEXT,
  qr_hash               TEXT NOT NULL UNIQUE,  -- HMAC-SHA256 signed
  qr_url                TEXT,
  status                TEXT NOT NULL DEFAULT 'valid'
                          CHECK (status IN (
                            'valid', 'scanned', 'refunded', 'transferred', 'cancelled'
                          )),
  scanned_at            TIMESTAMPTZ,
  scanned_by            UUID REFERENCES profiles(id),
  transferred_to_email  TEXT,
  transferred_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_instances_event_id     ON ticket_instances(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_organizer_id ON ticket_instances(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_holder_id    ON ticket_instances(holder_id);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_holder_email ON ticket_instances(holder_email);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_qr_hash      ON ticket_instances(qr_hash);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_status       ON ticket_instances(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ais_calc              ON ticket_instances(organizer_id, holder_id, status)
  WHERE status = 'scanned';

-- ════════════════════════════════════════════════
-- TABLE 8 : reviews
-- Only allowed if ticket_instance.status = 'scanned'
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES events(id),
  organizer_id        UUID NOT NULL REFERENCES organizers(id),
  reviewer_id         UUID NOT NULL REFERENCES profiles(id),
  ticket_instance_id  UUID NOT NULL UNIQUE REFERENCES ticket_instances(id),
  score_ambiance      SMALLINT NOT NULL CHECK (score_ambiance BETWEEN 1 AND 5),
  score_organisation  SMALLINT NOT NULL CHECK (score_organisation BETWEEN 1 AND 5),
  score_musique       SMALLINT NOT NULL CHECK (score_musique BETWEEN 1 AND 5),
  score_securite      SMALLINT NOT NULL CHECK (score_securite BETWEEN 1 AND 5),
  score_avg           NUMERIC(3,2) GENERATED ALWAYS AS (
                        (score_ambiance + score_organisation +
                         score_musique + score_securite)::NUMERIC / 4
                      ) STORED,
  comment             TEXT,
  is_visible          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_event_id     ON reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_organizer_id ON reviews(organizer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id  ON reviews(reviewer_id);

-- Trigger: update organizer avg_review_score + credibility_badge after each review
CREATE OR REPLACE FUNCTION update_organizer_review_score()
RETURNS TRIGGER AS $$
DECLARE
  v_avg   NUMERIC(3,2);
  v_badge TEXT;
BEGIN
  SELECT AVG(score_avg) INTO v_avg
  FROM reviews
  WHERE organizer_id = NEW.organizer_id AND is_visible = TRUE;

  v_badge := CASE
    WHEN v_avg >= 4.5 THEN 'super_orga'
    WHEN v_avg >= 4.0 THEN 'orga_verifie'
    WHEN v_avg >= 3.5 THEN 'orga_confirme'
    ELSE NULL
  END;

  UPDATE organizers
  SET avg_review_score = v_avg, credibility_badge = v_badge
  WHERE id = NEW.organizer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reviews_update_organizer_score
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_organizer_review_score();

-- ════════════════════════════════════════════════
-- TABLE 9 : team_members (Vybe Cercle)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id  UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by    UUID REFERENCES profiles(id),
  role          TEXT NOT NULL
                  CHECK (role IN (
                    'owner', 'admin', 'finance',
                    'communication', 'billetterie', 'viewer'
                  )),
  action_log    JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organizer_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_organizer_id ON team_members(organizer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile_id   ON team_members(profile_id);

-- ════════════════════════════════════════════════
-- TABLE 10 : circle_members
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS circle_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id   UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by  UUID REFERENCES profiles(id),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'removed')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id  ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_profile_id ON circle_members(profile_id);

-- Trigger: keep circles.members_count in sync
CREATE OR REPLACE FUNCTION update_circle_members_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circles
  SET members_count = (
    SELECT COUNT(*) FROM circle_members
    WHERE circle_id = COALESCE(NEW.circle_id, OLD.circle_id)
      AND status = 'active'
  )
  WHERE id = COALESCE(NEW.circle_id, OLD.circle_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER circle_members_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON circle_members
  FOR EACH ROW EXECUTE FUNCTION update_circle_members_count();

-- ════════════════════════════════════════════════
-- TABLE 11 : participant_scores (AIS)
-- Calculated by Edge Function after each scan
-- score = (attendance_rate × 40)
--       + (MIN(recurrence_count, 10) × 5)
--       + (MIN(reviews_count, 3) × 5)
--       + (early_bird_ratio × 10)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS participant_scores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id        UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  participant_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score               SMALLINT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  badge               TEXT NOT NULL DEFAULT 'fiable'
                        CHECK (badge IN ('vip_gold', 'habitue', 'fiable', 'a_risque')),
  attendance_rate     NUMERIC(4,3) NOT NULL DEFAULT 0,
  recurrence_count    SMALLINT NOT NULL DEFAULT 0,
  reviews_count       SMALLINT NOT NULL DEFAULT 0,
  early_bird_ratio    NUMERIC(4,3) NOT NULL DEFAULT 0,
  last_event_at       TIMESTAMPTZ,
  last_calculated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organizer_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_scores_organizer_id ON participant_scores(organizer_id);
CREATE INDEX IF NOT EXISTS idx_participant_scores_badge        ON participant_scores(badge);

-- ════════════════════════════════════════════════
-- TABLE 12 : organizer_posts
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizer_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id  UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  type          TEXT NOT NULL DEFAULT 'announcement'
                  CHECK (type IN (
                    'announcement', 'teasing', 'lineup',
                    'behind_scenes', 'recap'
                  )),
  content       TEXT NOT NULL,
  media_urls    TEXT[] NOT NULL DEFAULT '{}',
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_posts_organizer_id ON organizer_posts(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_posts_created_at   ON organizer_posts(created_at DESC);

-- ════════════════════════════════════════════════
-- TABLE 13 : follows
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_id  UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, organizer_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_organizer_id ON follows(organizer_id);

-- Trigger: keep organizers.followers_count in sync
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizers SET followers_count = followers_count + 1 WHERE id = NEW.organizer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizers SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.organizer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER follows_count_sync
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_followers_count();

-- ════════════════════════════════════════════════
-- TABLE 14 : service_providers (Annuaire éditorial)
-- Managed from /admin only — no user accounts for providers
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS service_providers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  category         TEXT NOT NULL
                     CHECK (category IN (
                       'vj_visuals', 'lighting', 'sound',
                       'decor', 'security', 'photo_video'
                     )),
  city             TEXT NOT NULL,
  bio              TEXT,
  portfolio_urls   TEXT[] NOT NULL DEFAULT '{}',
  contact_email    TEXT,
  price_range      TEXT,   -- e.g. "200-500€" — indicative only
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(category);
CREATE INDEX IF NOT EXISTS idx_service_providers_city     ON service_providers(city);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_instances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers  ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── organizers ────────────────────────────────────────────────────────────────

CREATE POLICY "organizers_select_public"
  ON organizers FOR SELECT USING (TRUE);

CREATE POLICY "organizers_update_own"
  ON organizers FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "organizers_insert_own"
  ON organizers FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ── circles ───────────────────────────────────────────────────────────────────

-- Orga team can see their circles
CREATE POLICY "circles_select_team"
  ON circles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = circles.organizer_id
      AND tm.profile_id = auth.uid()
  ));

CREATE POLICY "circles_insert_owner_admin"
  ON circles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = circles.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  ));

CREATE POLICY "circles_update_owner_admin"
  ON circles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = circles.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  ));

-- ── events ────────────────────────────────────────────────────────────────────

-- Public events: visible to all
CREATE POLICY "events_select_public"
  ON events FOR SELECT
  USING (status = 'published' AND visibility = 'public');

-- Circle events: visible to circle members only
CREATE POLICY "events_select_circle"
  ON events FOR SELECT
  USING (
    status = 'published'
    AND visibility = 'circle_only'
    AND EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = events.circle_id
        AND cm.profile_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Team can see all events (incl. draft)
CREATE POLICY "events_select_team"
  ON events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = events.organizer_id
      AND tm.profile_id = auth.uid()
  ));

CREATE POLICY "events_insert_owner_admin"
  ON events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = events.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  ));

CREATE POLICY "events_update_owner_admin"
  ON events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = events.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  ));

-- ── ticket_types ──────────────────────────────────────────────────────────────

-- Public: visible ticket types for published events
CREATE POLICY "ticket_types_select_public"
  ON ticket_types FOR SELECT
  USING (
    is_visible = TRUE
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = ticket_types.event_id
        AND e.status = 'published'
        AND e.visibility = 'public'
    )
  );

-- Team: can see all ticket types
CREATE POLICY "ticket_types_select_team"
  ON ticket_types FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events e
    JOIN team_members tm ON tm.organizer_id = e.organizer_id
    WHERE e.id = ticket_types.event_id
      AND tm.profile_id = auth.uid()
  ));

CREATE POLICY "ticket_types_manage_team"
  ON ticket_types FOR ALL
  USING (EXISTS (
    SELECT 1 FROM events e
    JOIN team_members tm ON tm.organizer_id = e.organizer_id
    WHERE e.id = ticket_types.event_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'billetterie')
  ));

-- ── orders ────────────────────────────────────────────────────────────────────

-- Buyer can see their own orders
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR buyer_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Team can see their orders
CREATE POLICY "orders_select_team"
  ON orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = orders.organizer_id
      AND tm.profile_id = auth.uid()
  ));

-- Insert is only done via service role (Stripe webhook)
-- No direct insert policy for anon/user (handled server-side)

-- ── ticket_instances ──────────────────────────────────────────────────────────

-- Holder can see their tickets
CREATE POLICY "tickets_select_own"
  ON ticket_instances FOR SELECT
  USING (
    holder_id = auth.uid()
    OR holder_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Team can see all tickets for their events
CREATE POLICY "tickets_select_team"
  ON ticket_instances FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = ticket_instances.organizer_id
      AND tm.profile_id = auth.uid()
  ));

-- Scan update: only billetterie role or above
CREATE POLICY "tickets_scan_update"
  ON ticket_instances FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = ticket_instances.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'billetterie')
  ));

-- ── reviews ───────────────────────────────────────────────────────────────────

-- Organizer team sees reviews for their events
CREATE POLICY "reviews_select_organizer"
  ON reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = reviews.organizer_id
      AND tm.profile_id = auth.uid()
  ));

-- Reviewer can see their own review
CREATE POLICY "reviews_select_own"
  ON reviews FOR SELECT
  USING (reviewer_id = auth.uid());

-- Insert only if ticket was scanned
CREATE POLICY "reviews_insert_verified"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM ticket_instances ti
      WHERE ti.id = reviews.ticket_instance_id
        AND ti.holder_id = auth.uid()
        AND ti.status = 'scanned'
    )
  );

-- ── team_members ──────────────────────────────────────────────────────────────

-- Member can see their own memberships
CREATE POLICY "team_members_select_self"
  ON team_members FOR SELECT
  USING (profile_id = auth.uid());

-- Team can see the full team list
CREATE POLICY "team_members_select_team"
  ON team_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm2
    WHERE tm2.organizer_id = team_members.organizer_id
      AND tm2.profile_id = auth.uid()
  ));

-- Only owner can manage the team
CREATE POLICY "team_members_manage_owner"
  ON team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = team_members.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'owner'
  ));

-- ── circle_members ────────────────────────────────────────────────────────────

-- Member can see circles they belong to
CREATE POLICY "circle_members_select_self"
  ON circle_members FOR SELECT
  USING (profile_id = auth.uid());

-- Orga team can see all circle members
CREATE POLICY "circle_members_select_team"
  ON circle_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circles c
    JOIN team_members tm ON tm.organizer_id = c.organizer_id
    WHERE c.id = circle_members.circle_id
      AND tm.profile_id = auth.uid()
  ));

-- Owner/admin manages circle membership
CREATE POLICY "circle_members_manage_owner_admin"
  ON circle_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM circles c
    JOIN team_members tm ON tm.organizer_id = c.organizer_id
    WHERE c.id = circle_members.circle_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  ));

-- ── participant_scores (AIS) ──────────────────────────────────────────────────
-- CRITICAL: participant can NEVER see their own score

CREATE POLICY "scores_select_organizer_only"
  ON participant_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = participant_scores.organizer_id
      AND tm.profile_id = auth.uid()
  ));

-- ── organizer_posts ───────────────────────────────────────────────────────────

-- Public posts visible to all
CREATE POLICY "posts_select_public"
  ON organizer_posts FOR SELECT
  USING (is_published = TRUE);

-- Team manages posts
CREATE POLICY "posts_manage_team"
  ON organizer_posts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organizer_id = organizer_posts.organizer_id
      AND tm.profile_id = auth.uid()
      AND tm.role IN ('owner', 'admin', 'communication')
  ));

-- ── follows ───────────────────────────────────────────────────────────────────

CREATE POLICY "follows_select_all"
  ON follows FOR SELECT USING (TRUE);

CREATE POLICY "follows_insert_own"
  ON follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE
  USING (follower_id = auth.uid());

-- ── service_providers ─────────────────────────────────────────────────────────

-- Authenticated users can read active providers
CREATE POLICY "service_providers_select_authenticated"
  ON service_providers FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Write via service role only (Admin Vybe back-office)

-- ══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (run after schema)
-- ══════════════════════════════════════════════════════════════════════════════
-- Execute these manually in Supabase Storage settings or via CLI:
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('qr-codes', 'qr-codes', true),
--          ('event-covers', 'event-covers', true),
--          ('avatars', 'avatars', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
