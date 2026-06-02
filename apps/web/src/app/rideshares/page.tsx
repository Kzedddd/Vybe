"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Rideshare, Event } from "@/lib/types";
import { MapPin, Users, Clock, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/format";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function RidesharesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");
  const { user, loading: authLoading } = useAuth();
  const [rides, setRides] = useState<(Rideshare & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my_rides">("available");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        fetchRideshares();
      }
    }
  }, [authLoading, user, router, eventId, activeTab]);

  const fetchRideshares = async () => {
    try {
      let query = supabase
        .from("rideshares")
        .select("*, event_id(*)")
        .eq("status", "active");

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      if (activeTab === "my_rides") {
        query = query.eq("driver_id", user?.id);
      } else {
        query = query.gte("available_seats", 1);
      }

      const { data, error } = await query.order("departure_time", {
        ascending: true,
      });

      if (error) throw error;
      setRides((data || []) as any);
    } catch (error) {
      console.error("Error fetching rideshares:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Rideshares</h1>
          <p className="text-gray-600">Find rides to and from events, or offer one</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-2 rounded-lg transition font-semibold ${
              activeTab === "available"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Available Rides
          </button>
          <button
            onClick={() => setActiveTab("my_rides")}
            className={`px-6 py-2 rounded-lg transition font-semibold ${
              activeTab === "my_rides"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Rides
          </button>
        </div>

        {/* Rides List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-600 mb-4">No rides available at the moment</p>
            <button
              onClick={() => router.push("/organizer/create")}
              className="btn btn-primary"
            >
              Offer a Ride
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          {(ride.event_id as any)?.title || "Event Ride"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Offered by {ride.driver_name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-700">{formatDate(ride.departure_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-700">{ride.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-gray-700">
                          {ride.available_seats} seats left
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="font-semibold text-gray-700">
                          {formatCurrency(ride.price_per_seat)} per seat
                        </span>
                      </div>
                    </div>

                    {ride.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        "{ride.notes}"
                      </p>
                    )}
                  </div>

                  <button className="btn btn-primary ml-4">
                    {activeTab === "my_rides" ? "Edit" : "Book Seat"}
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
