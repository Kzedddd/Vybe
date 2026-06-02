"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/types";
import { Plus, BarChart3, Eye, Edit2 } from "lucide-react";
import { formatDate } from "@/utils/format";

export default function OrganizerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !profile?.is_organizer)) {
      router.push("/");
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (profile?.is_organizer) {
      fetchOrganizerEvents();
    }
  }, [profile]);

  const fetchOrganizerEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", profile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Organizer Dashboard</h1>
            <p className="text-gray-600">Manage your events and track sales</p>
          </div>
          <Link
            href="/organizer/create"
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold mt-2">{events.length}</p>
              </div>
              <BarChart3 size={32} className="text-purple-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Views</p>
                <p className="text-3xl font-bold mt-2">
                  {events.reduce((sum, e) => sum + e.sold_tickets, 0)}
                </p>
              </div>
              <Eye size={32} className="text-blue-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Published</p>
                <p className="text-3xl font-bold mt-2">
                  {events.filter((e) => e.status === "published").length}
                </p>
              </div>
              <BarChart3 size={32} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Your Events</h2>
          </div>
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">You haven't created any events yet</p>
              <Link
                href="/organizer/create"
                className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{formatDate(event.date_time)}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-600">
                        {event.sold_tickets} of {event.capacity} sold
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/organizer/edit/${event.id}`}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
