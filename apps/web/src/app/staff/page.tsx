"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { StaffListing, Event } from "@/lib/types";
import { Briefcase, MapPin, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function StaffListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<(StaffListing & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my_listings">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    event_id: "",
    position: "",
    description: "",
    hourly_rate: 0,
    positions_available: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        fetchListings();
        fetchEvents();
      }
    }
  }, [authLoading, user, router, filter]);

  const fetchListings = async () => {
    try {
      let query = supabase
        .from("staff_listings")
        .select("*, event_id(*)")
        .eq("status", "open");

      if (filter === "my_listings") {
        query = query.eq("organizer_id", user?.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data || []) as any);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date_time")
        .eq("organizer_id", user?.id)
        .eq("status", "published")
        .order("date_time", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id || !formData.position || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("staff_listings").insert({
        event_id: formData.event_id,
        organizer_id: user?.id,
        position: formData.position,
        description: formData.description,
        hourly_rate: formData.hourly_rate,
        positions_available: formData.positions_available,
        status: "open",
        applications_count: 0,
      });

      if (error) throw error;

      toast.success("Listing created successfully!");
      setFormData({
        event_id: "",
        position: "",
        description: "",
        hourly_rate: 0,
        positions_available: 1,
      });
      setShowCreateModal(false);
      fetchListings();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Staff Opportunities</h1>
            <p className="text-gray-600">Find and apply for event staff positions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Post Position
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Positions
          </button>
          <button
            onClick={() => setFilter("my_listings")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "my_listings"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Listings
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Post Staff Position</h2>

              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="label">Event *</label>
                  <select
                    className="input"
                    value={formData.event_id}
                    onChange={(e) =>
                      setFormData({ ...formData, event_id: e.target.value })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Position Title *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Security, Bartender"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Job description and requirements"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Hourly Rate</label>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: parseFloat(e.target.value),
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="label">Positions Available</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={formData.positions_available}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          positions_available: parseInt(e.target.value),
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? "Posting..." : "Post Position"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {filter === "my_listings"
                ? "No positions posted yet"
                : "No open positions available"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="card hover:shadow-lg transition">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{listing.position}</h3>
                      <p className="text-sm text-gray-600">
                        {(listing.event_id as any)?.title || "Event"}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {listing.positions_available} open
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold">
                      ${listing.hourly_rate}/hr
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase size={16} />
                    <span>{listing.applications_count || 0} applications</span>
                  </div>
                </div>

                <button className="w-full btn btn-primary">
                  {filter === "my_listings" ? "View Applications" : "Apply"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
