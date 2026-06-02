"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FanClub } from "@/lib/types";
import { Heart, Users, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function FanClubsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [fanClubs, setFanClubs] = useState<FanClub[]>([]);
  const [myClubs, setMyClubs] = useState<FanClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tier_name: "fan",
    tier_price: 0,
    tier_description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        fetchFanClubs();
        fetchMyClubs();
      }
    }
  }, [authLoading, user, router]);

  const fetchFanClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("fan_clubs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setFanClubs(data || []);
    } catch (error) {
      console.error("Error fetching fan clubs:", error);
      toast.error("Failed to load fan clubs");
    }
  };

  const fetchMyClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("fan_clubs")
        .select("*")
        .eq("creator_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyClubs(data || []);
    } catch (error) {
      console.error("Error fetching my clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.tier_description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("fan_clubs").insert({
        creator_id: user?.id,
        name: formData.name,
        description: formData.description,
        tier_name: formData.tier_name,
        tier_price: formData.tier_price,
        tier_description: formData.tier_description,
        members_count: 0,
      });

      if (error) throw error;

      toast.success("Fan club created successfully!");
      setFormData({
        name: "",
        description: "",
        tier_name: "fan",
        tier_price: 0,
        tier_description: "",
      });
      setShowCreateModal(false);
      fetchMyClubs();
    } catch (error: any) {
      console.error("Error creating fan club:", error);
      toast.error(error.message || "Failed to create fan club");
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
            <h1 className="text-4xl font-bold mb-2">Fan Clubs</h1>
            <p className="text-gray-600">
              Build and manage exclusive communities with your fans
            </p>
          </div>
          {profile?.is_creator && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Create Club
            </button>
          )}
        </div>

        {/* My Clubs Section */}
        {myClubs.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">My Fan Clubs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {myClubs.map((club) => (
                <div
                  key={club.id}
                  className="card overflow-hidden hover:shadow-lg transition"
                >
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-32 flex items-center justify-center mb-4">
                    <Heart size={48} className="text-purple-400" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{club.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {club.description}
                    </p>

                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-semibold text-purple-600">
                        {club.tier_name} Tier: ${club.tier_price}/month
                      </p>
                      <p className="text-xs text-gray-600">
                        {club.members_count || 0} members
                      </p>
                    </div>

                    <button className="w-full btn btn-secondary text-sm">
                      Manage Club
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Create Fan Club</h2>

              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="label">Club Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., VIP Music Fans"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="What's your fan club about?"
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

                <div>
                  <label className="label">Membership Tier Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., VIP Member"
                    value={formData.tier_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier_name: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Monthly Price</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={formData.tier_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier_price: parseFloat(e.target.value),
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="label">Membership Benefits *</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="What do members get?"
                    value={formData.tier_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier_description: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
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
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* All Fan Clubs */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Discover Fan Clubs</h2>
          {fanClubs.length === 0 ? (
            <div className="card p-12 text-center">
              <Heart size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No fan clubs available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {fanClubs.map((club) => (
                <div
                  key={club.id}
                  className="card overflow-hidden hover:shadow-lg transition cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-32 flex items-center justify-center mb-4">
                    <Heart size={48} className="text-purple-400" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{club.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {club.description}
                    </p>

                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-semibold text-purple-600">
                        ${club.tier_price}/month
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Users size={14} />
                        {club.members_count || 0} members
                      </div>
                    </div>

                    <button className="w-full btn btn-primary text-sm">
                      Join Club
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
