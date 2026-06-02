import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@vybe/shared";
import { useAuthStore } from "../store/auth";

export default function AuthLayout() {
  const [isReady, setIsReady] = useState(false);
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          setUser(data.session.user);
          router.replace("/(tabs)");
        } else {
          setUser(null);
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setLoading(false);
        setIsReady(true);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
