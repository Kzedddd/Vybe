"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/types";
import { Trending, MapPin, Calendar } from "lucide-react";
import { formatDate } from "@/utils/format";

export default function DiscoverPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .is_featured(true)
          .limit(12);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Trending className="text-purple-600" size={32} />
            <h1 className="text-4xl font-bold">What's Trending</h1>
          </div>
          <p className="text-gray-600">Check out the hottest events everyone's talking about</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="card overflow-hidden hover:shadow-lg transition hover:scale-105 cursor-pointer h-full">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-purple-600 font-semibold uppercase mb-1">
                      {event.category}
                    </p>
                    <h3 className="font-bold mb-2 line-clamp-2">{event.title}</h3>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(event.date_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
