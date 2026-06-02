'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Search, MapPin, Calendar, Users, Heart } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS (INLINE)
// ============================================================================

interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  totalQuantity: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  category: string;
  organizerId: string;
  ticketTypes: TicketType[];
  capacity: number;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS (INLINE)
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(date);
};

const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getInitialPrice = (ticketTypes: TicketType[] | undefined): number => {
  if (!ticketTypes || ticketTypes.length === 0) return 0;
  return Math.min(...ticketTypes.map((t) => t.price));
};

const getAvailableTickets = (ticketTypes: TicketType[] | undefined): number => {
  if (!ticketTypes || ticketTypes.length === 0) return 0;
  return ticketTypes.reduce((sum, t) => sum + t.available, 0);
};

// ============================================================================
// SUPABASE CLIENT (INLINE)
// ============================================================================

const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
};

// ============================================================================
// EVENT CARD COMPONENT (INLINE)
// ============================================================================

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const minPrice = getInitialPrice(event.ticketTypes);
  const availableTickets = getAvailableTickets(event.ticketTypes);
  const soldOut = availableTickets === 0;

  return (
    <Link href={`/events/${event.id}`}>
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(-4px)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }}
      >
        {/* Image Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            backgroundColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart
              size={20}
              style={{
                color: isFavorite ? '#dc2626' : '#999',
                fill: isFavorite ? '#dc2626' : 'none',
              }}
            />
          </button>

          {/* Status Badge */}
          {soldOut && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              COMPLET
            </div>
          )}
        </div>

        {/* Content Container */}
        <div style={{ padding: '16px' }}>
          {/* Title */}
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111',
              marginBottom: '8px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.title}
          </h3>

          {/* Date and Time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          >
            <Calendar size={14} />
            <span>{formatDate(event.date)}</span>
          </div>

          {/* Location */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            <MapPin size={14} />
            <span>{event.city}</span>
          </div>

          {/* Attendees */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#999',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            <Users size={14} />
            <span>
              {event.attendeeCount} / {event.capacity} participants
            </span>
          </div>

          {/* Price and Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <div>
              {minPrice > 0 ? (
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#7c3aed',
                  }}
                >
                  À partir de {formatCurrency(minPrice)}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#7c3aed',
                  }}
                >
                  Gratuit
                </div>
              )}
            </div>
            <div
              style={{
                backgroundColor: '#7c3aed',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                opacity: soldOut ? 0.5 : 1,
                cursor: soldOut ? 'not-allowed' : 'pointer',
              }}
            >
              {soldOut ? 'Complet' : 'Voir'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const supabase = createSupabaseClient();

        const { data, error: supabaseError } = await supabase
          .from('events')
          .select(
            `
            id,
            title,
            description,
            imageUrl,
            date,
            startTime,
            endTime,
            location,
            city,
            country,
            latitude,
            longitude,
            category,
            organizerId,
            capacity,
            attendeeCount,
            createdAt,
            updatedAt,
            published,
            ticketTypes:ticket_types(id,name,price,available,totalQuantity)
          `
          )
          .eq('published', true)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (supabaseError) {
          throw supabaseError;
        }

        setEvents(data as Event[]);
        setFilteredEvents(data as Event[]);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Impossible de charger les événements');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events
  useEffect(() => {
    let result = events;

    // Search filter
    if (searchTerm) {
      result = result.filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((event) => event.category === selectedCategory);
    }

    setFilteredEvents(result);
  }, [searchTerm, selectedCategory, events]);

  const categories = [
    'all',
    'music',
    'sports',
    'conference',
    'festival',
    'nightlife',
    'arts',
  ];

  return (
    <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ backgroundColor: '#fff', paddingTop: '24px', paddingBottom: '24px' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#111',
              marginBottom: '8px',
            }}
          >
            Découvrez les événements
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Trouvez et suivez vos événements préférés
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        {/* Search and Filter Bar */}
        <div
          style={{
            marginBottom: '32px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            gridTemplateAreas: '"search filters" "categories categories"',
          }}
        >
          {/* Search Input */}
          <div style={{ gridArea: 'search' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#999',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              />
            </div>
          </div>

          {/* Results Count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              color: '#666',
            }}
          >
            {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
          </div>

          {/* Category Filter */}
          <div
            style={{
              gridArea: 'categories',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? 'none' : '1px solid #d1d5db',
                  backgroundColor:
                    selectedCategory === cat ? '#7c3aed' : '#fff',
                  color: selectedCategory === cat ? '#fff' : '#666',
                  fontSize: '13px',
                  fontWeight:
                    selectedCategory === cat ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat) {
                    e.currentTarget.style.borderColor = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {cat === 'all' ? 'Tous les événements' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                marginBottom: '12px',
              }}
            >
              Chargement des événements...
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #7c3aed',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111',
                marginBottom: '8px',
              }}
            >
              Aucun événement trouvé
            </div>
            <p style={{ color: '#666' }}>
              {searchTerm
                ? 'Essayez une autre recherche'
                : 'Revenez bientôt pour découvrir de nouveaux événements'}
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
