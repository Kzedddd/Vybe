"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/types";
import { Search, MapPin, Calendar, Users, Star } from "lucide-react";
import { formatDate } from "@/utils/format";
import Link from "next/link";

export default function ExplorePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const categories = [
    "all",
    "music",
    "sports",
    "conference",
    "festival",
    "nightlife",
    "workshop",
  ];

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("*, ticket_types(price)")
        .eq("status", "published");

      // Category filter
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      // Search filter
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        );
      }

      // Sort
      if (sortBy === "date") {
        query = query.order("date_time", { ascending: true });
      } else if (sortBy === "popular") {
        query = query.order("sold_tickets", { ascending: false });
      } else if (sortBy === "rating") {
        query = query.order("avg_rating", { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Client-side price filtering
      let filtered = data || [];
      if (priceRange !== "all") {
        filtered = filtered.filter((event) => {
          const prices = (event.ticket_types as any[])?.map((t) => t.price) || [];
          const minPrice = Math.min(...prices, Infinity);

          if (priceRange === "free") return minPrice === 0;
          if (priceRange === "under50") return minPrice > 0 && minPrice < 50;
          if (priceRange === "50to100") return minPrice >= 50 && minPrice <= 100;
          if (priceRange === "over100") return minPrice > 100;
          return true;
        });
      }

      setEvents(filtered);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Events</h1>
          <p className="text-gray-600 mb-8">
            Discover amazing events happening around you
          </p>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search events by name, location, or keyword..."
              className="input pl-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 space-y-6 sticky top-4">
              {/* Category Filter */}
              <div>
                <h3 className="font-bold text-lg mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="accent-purple-600"
                      />
                      <span className="text-gray-700 capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-bold text-lg mb-3">Price Range</h3>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Prices" },
                    { value: "free", label: "Free" },
                    { value: "under50", label: "Under $50" },
                    { value: "50to100", label: "$50 - $100" },
                    { value: "over100", label: "Over $100" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        value={option.value}
                        checked={priceRange === option.value}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="accent-purple-600"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-bold text-lg mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input"
                >
                  <option value="date">Earliest Date</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-600 mb-4">No events found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setPriceRange("all");
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="card overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col">
                      {/* Event Image */}
                      <div className="bg-gradient-to-br from-purple-200 to-pink-200 h-48 flex items-center justify-center">
                        {event.image_url && (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                            {event.category}
                          </span>
                          {event.avg_rating && (
                            <div className="flex items-center gap-1">
                              <Star
                                size={16}
                                className="text-yellow-400 fill-current"
                              />
                              <span className="text-sm font-semibold">
                                {event.avg_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-lg mb-3 line-clamp-2 flex-1">
                          {event.title}
                        </h3>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(event.date_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          {event.sold_tickets !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users size={16} />
                              <span>{event.sold_tickets} attending</span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <button className="w-full btn btn-primary text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
