import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@vybe/shared";
import { Event } from "@vybe/shared";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("date_time", { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1F2937" }}>
            Discover Events
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            Find amazing events near you
          </Text>
        </View>

        {/* Events List */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {events.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#6B7280", paddingVertical: 20 }}>
                No events found
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => router.push(`/event/${event.id}`)}
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1F2937",
                      }}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginTop: 4,
                      }}
                    >
                      {event.category} • {event.location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
