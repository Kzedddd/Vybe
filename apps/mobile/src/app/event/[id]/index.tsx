import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@vybe/shared";
import { Event, TicketType } from "@vybe/shared";

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      if (!id) return;

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: ticketsData } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", id);

      setTicketTypes(ticketsData || []);
    } catch (error) {
      console.error("Error fetching event:", error);
      Alert.alert("Error", "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6B7280" }}>Event not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: "#7C3AED", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cheapestTicket = ticketTypes.length > 0 ? ticketTypes[0].price : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#F9FAFB",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 24, color: "#7C3AED" }}>←</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: "#1F2937", marginLeft: 12 }}>
            {event.title}
          </Text>
        </View>

        {/* Event Image */}
        {event.image_url && (
          <View
            style={{
              width: "100%",
              height: 240,
              backgroundColor: "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#9CA3AF" }}>📸 Event Image</Text>
          </View>
        )}

        {/* Event Details */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
            {event.title}
          </Text>

          <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600", marginBottom: 12 }}>
            {event.category.toUpperCase()}
          </Text>

          {/* Meta Information */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>📅 Date & Time</Text>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#1F2937", marginTop: 4 }}>
                {new Date(event.date_time).toLocaleDateString()} •{" "}
                {new Date(event.date_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>📍 Location</Text>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#1F2937", marginTop: 4 }}>
                {event.location}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>👥 Attendees</Text>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#1F2937", marginTop: 4 }}>
                {event.sold_tickets} of {event.capacity}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 8 }}>
              About this event
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", lineHeight: 20 }}>
              {event.description}
            </Text>
          </View>

          {/* Tickets */}
          {ticketTypes.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
                Tickets
              </Text>
              {ticketTypes.map((ticket) => (
                <View
                  key={ticket.id}
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                        {ticket.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                        {ticket.quantity_sold} available
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#7C3AED" }}>
                      ${ticket.price}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#7C3AED",
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
              Buy Tickets
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
