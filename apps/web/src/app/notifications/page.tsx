"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "@/lib/types";
import { Bell, Trash2, CheckCircle, Circle } from "lucide-react";
import { formatDate } from "@/utils/format";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        fetchNotifications();
      }
    }
  }, [authLoading, user, router, filter]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        `/api/notifications?unread_only=${filter === "unread"}`
      );
      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, is_read: boolean) => {
    try {
      await axios.post(`/api/notifications`, {
        notification_id: notificationId,
        is_read: !is_read,
      });

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: !is_read } : n
        )
      );
    } catch (error: any) {
      console.error("Error updating notification:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Since we don't have a delete endpoint, we'll just remove from UI
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      toast.success("Notification removed");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event_update":
        return "📅";
      case "new_follower":
        return "👥";
      case "order_confirmation":
        return "🎫";
      case "payment_received":
        return "💰";
      case "group_invitation":
        return "👫";
      default:
        return "🔔";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated on events and activities</p>
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
            All Notifications
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "unread"
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`card p-4 flex items-start justify-between gap-4 hover:shadow transition ${
                  !notification.is_read ? "bg-blue-50 border-l-4 border-blue-600" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleMarkAsRead(
                        notification.id,
                        notification.is_read
                      )
                    }
                    className={`p-2 rounded-lg transition ${
                      notification.is_read
                        ? "text-gray-400 hover:text-green-600"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                    title={notification.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {notification.is_read ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={20} />
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
