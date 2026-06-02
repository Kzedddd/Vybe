"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Profile } from "@/lib/types";
import { Users, MapPin, Link as LinkIcon, Mail, Heart, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const params = useParams();
  const { profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const profileId = params.id as string;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (error) throw error;
        setProfile(data);

        // Check if current user is following this user
        if (currentUserProfile) {
          const { data: followData } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", currentUserProfile.id)
            .eq("following_id", profileId)
            .single();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Profile not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, currentUserProfile]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Cover Area */}
      <div className="h-40 bg-gradient-to-r from-purple-400 to-pink-400"></div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 -mt-20 mb-8">
          <img
            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`}
            alt={profile.username}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />

          <div className="flex-1 flex flex-col justify-end md:py-4">
            <div className="mb-4">
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-purple-600 font-semibold text-sm uppercase mt-1">
                {profile.badge_level}
              </p>
            </div>

            {currentUserProfile?.id !== profile.id && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!currentUserProfile) {
                      toast.error("Please sign in first");
                      return;
                    }
                    if (isFollowing) {
                      await supabase
                        .from("follows")
                        .delete()
                        .eq("follower_id", currentUserProfile.id)
                        .eq("following_id", profile.id);
                      setIsFollowing(false);
                      toast.success("Unfollowed");
                    } else {
                      await supabase.from("follows").insert({
                        follower_id: currentUserProfile.id,
                        following_id: profile.id,
                      });
                      setIsFollowing(true);
                      toast.success("Followed!");
                    }
                  }}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    isFollowing
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Share2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bio & Info */}
        {profile.bio && <p className="text-gray-700 mb-6 leading-relaxed">{profile.bio}</p>}

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 py-4 border-t border-b">
          {profile.location && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={20} className="text-purple-600" />
              <span>{profile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <Mail size={20} className="text-purple-600" />
            <span>{profile.email}</span>
          </div>
          {profile.website && (
            <div className="flex items-center gap-2 text-gray-700">
              <LinkIcon size={20} className="text-purple-600" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                Website
              </a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBox label="Events Attended" value={profile.events_attended} />
          <StatBox label="Reviews Written" value={profile.reviews_written} />
          <StatBox label="Following" value={profile.following_count} />
          <StatBox label="Followers" value={profile.followers_count} />
        </div>

        {profile.is_organizer && (
          <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 mb-8">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="text-xl">🎫</span>
              Event Organizer
            </h3>
            <p className="text-gray-700">This user organizes amazing events!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-purple-600">{value}</p>
    </div>
  );
}
