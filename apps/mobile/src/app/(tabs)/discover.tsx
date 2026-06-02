import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@vybe/shared";
import { Event } from "@vybe/shared";
import { useRouter } from "expo-router";

export default function DiscoverScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = ["Music", "Sports", "Conference", "Festival", "Nightlife", "Workshop"];

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "published");

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq("category", selectedCategory.toLowerCase());
      }

      const { data, error } = await query.limit(20);

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
            Discover
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TextInput
            placeholder="Search events..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              fontSize: 14,
            }}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, marginBottom: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory("")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: selectedCategory === "" ? "#7C3AED" : "#F3F4F6",
            }}
          >
            <Text style={{ color: selectedCategory === "" ? "#FFFFFF" : "#1F2937", fontSize: 12 }}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat ? "#7C3AED" : "#F3F4F6",
              }}
            >
              <Text style={{ color: selectedCategory === cat ? "#FFFFFF" : "#1F2937", fontSize: 12 }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {events.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#6B7280" }}>No events found</Text>
            ) : (
              <View style={{ gap: 12 }}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => router.push(`/event/${event.id}`)}
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}>
                      {event.category.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1F2937",
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                      📍 {event.location}
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
