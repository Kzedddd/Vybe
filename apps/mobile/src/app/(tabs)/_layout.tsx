import React from "react";
import { Tabs } from "expo-router";
import { Home, Search, Heart, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon;

          if (route.name === "index") {
            icon = <Home color={color} size={size} />;
          } else if (route.name === "discover") {
            icon = <Search color={color} size={size} />;
          } else if (route.name === "saved") {
            icon = <Heart color={color} size={size} />;
          } else if (route.name === "profile") {
            icon = <User color={color} size={size} />;
          }

          return icon;
        },
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
