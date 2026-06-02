import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@vybe/shared";
import { useAuthStore } from "../store/auth";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUpWithPassword({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Update profile with full name
        const { error: updateError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: fullName,
            updated_at: new Date(),
          });

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }

        setUser(data.user);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 20, justifyContent: "space-between" }}>
          {/* Header */}
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1F2937", marginBottom: 8 }}>
              Join Vybe
            </Text>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>
              Create your account to get started
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: 40 }}>
            {error && (
              <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Text style={{ color: "#DC2626" }}>{error}</Text>
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Full Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
                placeholder="Min 6 characters"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Confirm Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#D1D5DB" : "#7C3AED",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: "#6B7280", marginBottom: 12 }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={{ color: "#7C3AED", fontWeight: "bold", fontSize: 16 }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
