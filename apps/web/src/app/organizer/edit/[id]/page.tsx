"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Event, TicketType } from "@/lib/types";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { formatDate } from "@/utils/format";
import axios from "axios";
import { Trash2, Plus } from "lucide-react";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user, profile } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "music",
    date_time: "",
    location: "",
    capacity: 0,
    image_url: "",
  });
  const [newTicketType, setNewTicketType] = useState({
    name: "",
    price: 0,
    quantity: 0,
  });
  const [showAddTicket, setShowAddTicket] = useState(false);

  useEffect(() => {
    if (user && profile && eventId) {
      fetchEvent();
    }
  }, [user, profile, eventId]);

  const fetchEvent = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      if (eventData.organizer_id !== profile?.id) {
        router.push("/organizer");
        return;
      }

      setEvent(eventData);
      setFormData({
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        date_time: eventData.date_time,
        location: eventData.location,
        capacity: eventData.capacity,
        image_url: eventData.image_url,
      });

      // Fetch ticket types
      const { data: tickets, error: ticketsError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId);

      if (ticketsError) throw ticketsError;
      setTicketTypes(tickets || []);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event");
      router.push("/organizer");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          date_time: formData.date_time,
          location: formData.location,
          capacity: formData.capacity,
          image_url: formData.image_url,
          updated_at: new Date(),
        })
        .eq("id", eventId);

      if (error) throw error;
      toast.success("Event updated successfully!");
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error(error.message || "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTicketType = async () => {
    if (!newTicketType.name || newTicketType.price <= 0 || newTicketType.quantity <= 0) {
      toast.error("Please fill in all ticket fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("ticket_types")
        .insert({
          event_id: eventId,
          name: newTicketType.name,
          price: newTicketType.price,
          quantity_available: newTicketType.quantity,
          quantity_sold: 0,
        });

      if (error) throw error;

      setNewTicketType({ name: "", price: 0, quantity: 0 });
      setShowAddTicket(false);
      fetchEvent();
      toast.success("Ticket type added!");
    } catch (error: any) {
      console.error("Error adding ticket type:", error);
      toast.error(error.message || "Failed to add ticket type");
    }
  };

  const handleDeleteTicketType = async (ticketId: string) => {
    if (!confirm("Delete this ticket type?")) return;

    try {
      const { error } = await supabase
        .from("ticket_types")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;
      setTicketTypes(ticketTypes.filter((t) => t.id !== ticketId));
      toast.success("Ticket type deleted");
    } catch (error: any) {
      console.error("Error deleting ticket type:", error);
      toast.error(error.message || "Failed to delete ticket type");
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">Edit Event</h1>

        <form onSubmit={handleUpdateEvent} className="card p-8 space-y-6">
          <div>
            <label className="label">Event Title *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className="input"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                disabled={isSubmitting}
              >
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="conference">Conference</option>
                <option value="festival">Festival</option>
                <option value="nightlife">Nightlife</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            <div>
              <label className="label">Date & Time *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.date_time}
                onChange={(e) =>
                  setFormData({ ...formData, date_time: e.target.value })
                }
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Location *</label>
            <input
              type="text"
              className="input"
              placeholder="Venue name and address"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Capacity *</label>
              <input
                type="number"
                className="input"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value),
                  })
                }
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="label">Image URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Ticket Types Section */}
        <div className="mt-12 card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Ticket Types</h2>
            <button
              onClick={() => setShowAddTicket(!showAddTicket)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Ticket Type
            </button>
          </div>

          {showAddTicket && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
              <div>
                <label className="label">Ticket Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., General Admission"
                  value={newTicketType.name}
                  onChange={(e) =>
                    setNewTicketType({
                      ...newTicketType,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Price</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={newTicketType.price}
                    onChange={(e) =>
                      setNewTicketType({
                        ...newTicketType,
                        price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={newTicketType.quantity}
                    onChange={(e) =>
                      setNewTicketType({
                        ...newTicketType,
                        quantity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddTicket(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTicketType}
                  className="flex-1 btn btn-primary"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {ticketTypes.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No ticket types yet</p>
          ) : (
            <div className="space-y-3">
              {ticketTypes.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {ticket.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ${ticket.price} • {ticket.quantity_available} available
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTicketType(ticket.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
