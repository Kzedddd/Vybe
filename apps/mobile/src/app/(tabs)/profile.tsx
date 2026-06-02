import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@vybe/shared";
import { Profile } from "@vybe/shared";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>Not signed in</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={{ backgroundColor: "#7C3AED", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1F2937" }}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937", marginBottom: 4 }}>
              {profile.username}
            </Text>
            <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600", marginBottom: 12 }}>
              {profile.badge_level.toUpperCase()}
            </Text>
            {profile.bio && (
              <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>{profile.bio}</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 8 }}>Stats</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Events</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7C3AED" }}>
                {profile.events_attended}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Reviews</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7C3AED" }}>
                {profile.reviews_written}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Followers</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7C3AED" }}>
                {profile.followers_count}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "#1F2937", fontWeight: "600", textAlign: "center" }}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "#DC2626", fontWeight: "600", textAlign: "center" }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
