"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Bell, Lock, Eye, Shield, LogOut, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    toast.success("Signed out successfully");
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(profile?.auth_id!);
      if (error) throw error;

      toast.success("Account deleted");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <Bell size={24} className="text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Notifications</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage how you receive notifications about events and activity
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm">Event reminders</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm">New follower notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <Eye size={24} className="text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Privacy</h3>
                <p className="text-gray-600 text-sm mb-4">Control who can see your profile and activity</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="radio" name="privacy" defaultChecked className="w-4 h-4" />
                    <span className="text-sm">Public profile</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="radio" name="privacy" className="w-4 h-4" />
                    <span className="text-sm">Private profile</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <Lock size={24} className="text-green-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Security</h3>
                <p className="text-gray-600 text-sm mb-4">Manage your account security settings</p>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-orange-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Two-Factor Authentication</h3>
                <p className="text-gray-600 text-sm mb-4">Add an additional layer of security to your account</p>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="card p-6 border-2 border-gray-200">
            <div className="flex items-start gap-4">
              <LogOut size={24} className="text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Sign Out</h3>
                <p className="text-gray-600 text-sm mb-4">Sign out from your account</p>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400 text-sm"
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <div className="card p-6 border-2 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <Trash2 size={24} className="text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-red-800">Delete Account</h3>
                <p className="text-red-700 text-sm mb-4">
                  Permanently delete your account and all associated data
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 text-sm"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
