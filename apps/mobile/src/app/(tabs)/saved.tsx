import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 16 }}>
      <View style={{ paddingVertical: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1F2937" }}>Saved Events</Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#6B7280", fontSize: 16 }}>No saved events yet</Text>
        <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4 }}>
          Add events to your saved list to access them later
        </Text>
      </View>
    </SafeAreaView>
  );
}
