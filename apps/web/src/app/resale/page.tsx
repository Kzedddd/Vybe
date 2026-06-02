"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ResaleListing, Event } from "@/lib/types";
import { DollarSign, Calendar, MapPin, Tag } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/format";
import Link from "next/link";

export default function ResaleMarketplacePage() {
  const [listings, setListings] = useState<(ResaleListing & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPrice, setFilterPrice] = useState<"all" | "cheap" | "expensive">("all");

  useEffect(() => {
    fetchListings();
  }, [filterPrice]);

  const fetchListings = async () => {
    try {
      let query = supabase
        .from("resale_listings")
        .select("*, event_id(*)")
        .eq("status", "active")
        .order("price_per_ticket", { ascending: true });

      if (filterPrice === "cheap") {
        query = query.lt("price_per_ticket", 50);
      } else if (filterPrice === "expensive") {
        query = query.gt("price_per_ticket", 100);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setListings((data || []) as any);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Ticket Resale Marketplace</h1>
          <p className="text-gray-600">Buy and sell tickets from verified sellers</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilterPrice("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filterPrice === "all"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Prices
          </button>
          <button
            onClick={() => setFilterPrice("cheap")}
            className={`px-4 py-2 rounded-lg transition ${
              filterPrice === "cheap"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Under $50
          </button>
          <button
            onClick={() => setFilterPrice("expensive")}
            className={`px-4 py-2 rounded-lg transition ${
              filterPrice === "expensive"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Over $100
          </button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-600">No listings available at the moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="card overflow-hidden hover:shadow-lg transition">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-32 flex items-center justify-center">
                  <Tag size={48} className="text-purple-400" />
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {(listing.event_id as any)?.title || "Event Ticket"}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="font-semibold text-lg text-green-600">
                        {formatCurrency(listing.price_per_ticket)} per ticket
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag size={16} />
                      <span>{listing.ticket_count} tickets available</span>
                    </div>
                  </div>

                  <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold">
                    Contact Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
