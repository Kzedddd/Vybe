"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LostItem, Event } from "@/lib/types";
import {
  AlertCircle,
  MapPin,
  Calendar,
  MessageSquare,
  Plus,
} from "lucide-react";
import { formatDate } from "@/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LostFoundPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<(LostItem & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unclaimed" | "my_items">("unclaimed");
  const [showPostModal, setShowPostModal] = useState(false);
  const [formData, setFormData] = useState({
    event_id: "",
    item_description: "",
    category: "other",
    location_found: "",
    contact_info: "",
    image_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        fetchItems();
        fetchEvents();
      }
    }
  }, [authLoading, user, router, filter]);

  const fetchItems = async () => {
    try {
      let query = supabase
        .from("lost_items")
        .select("*, event_id(*)")
        .order("created_at", { ascending: false });

      if (filter === "unclaimed") {
        query = query.eq("status", "unclaimed");
      } else if (filter === "my_items") {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setItems((data || []) as any);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .eq("status", "published")
        .order("date_time", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id || !formData.item_description) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("lost_items").insert({
        user_id: user?.id,
        event_id: formData.event_id,
        item_description: formData.item_description,
        category: formData.category,
        location_found: formData.location_found,
        contact_info: formData.contact_info,
        image_url: formData.image_url || null,
        status: "unclaimed",
      });

      if (error) throw error;

      toast.success("Item posted successfully!");
      setFormData({
        event_id: "",
        item_description: "",
        category: "other",
        location_found: "",
        contact_info: "",
        image_url: "",
      });
      setShowPostModal(false);
      fetchItems();
    } catch (error: any) {
      console.error("Error posting item:", error);
      toast.error(error.message || "Failed to post item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lost & Found</h1>
            <p className="text-gray-600">Help reunite people with their lost items</p>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Post Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter("unclaimed")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "unclaimed"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Unclaimed Items
          </button>
          <button
            onClick={() => setFilter("my_items")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "my_items"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Posts
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Items
          </button>
        </div>

        {/* Post Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Post Lost Item</h2>

              <form onSubmit={handlePostItem} className="space-y-4">
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
                  <label className="label">Item Description *</label>
                  <textarea
                    className="input"
                    placeholder="Describe the item in detail"
                    rows={3}
                    value={formData.item_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        item_description: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="other">Other</option>
                    <option value="phone">Phone</option>
                    <option value="keys">Keys</option>
                    <option value="wallet">Wallet</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>

                <div>
                  <label className="label">Where Found</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Near entrance, VIP section"
                    value={formData.location_found}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location_found: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Contact Info</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Email or phone (optional)"
                    value={formData.contact_info}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_info: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
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
                    {isSubmitting ? "Posting..." : "Post Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No items found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card hover:shadow-lg transition">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Item"
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          {item.item_description}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.category}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "unclaimed"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {item.status === "unclaimed" ? "Unclaimed" : "Claimed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {item.location_found}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(item.created_at)}
                      </div>
                    </div>

                    {item.contact_info && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <MessageSquare size={14} />
                        {item.contact_info}
                      </p>
                    )}
                  </div>

                  <button className="btn btn-secondary whitespace-nowrap">
                    Contact
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
