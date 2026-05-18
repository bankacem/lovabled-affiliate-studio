import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signIn, signUp, signOut, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    try {
      setSubmitting(true);
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmail("");
      setPassword("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.profileContent, { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }]}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" },
          ]}
        >
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>
            {user.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.profileEmail, { color: colors.foreground }]}>{user.email}</Text>
        {user.role && (
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + "18", borderRadius: 20 }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{user.role}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.cardRow}>
            <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
            <View>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Email</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{user.email}</Text>
            </View>
          </View>
          {user.role && (
            <View style={[styles.cardRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
              <View>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Role</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>{user.role}</Text>
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            {
              backgroundColor: colors.destructive + "12",
              borderColor: colors.destructive + "30",
              borderRadius: colors.radius,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.authContent, { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authHeader}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="person-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </Text>
          <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
            {mode === "signin"
              ? "Sign in to access your account"
              : "Join to explore designs and articles"}
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed || submitting ? 0.8 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={styles.switchMode}
          >
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileContent: { paddingHorizontal: 20, alignItems: "center", gap: 16 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
  },
  avatarLetter: { fontSize: 32, fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4 },
  roleText: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  card: {
    width: "100%", borderWidth: 1, overflow: "hidden", marginTop: 8,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  cardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  cardValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1,
    alignSelf: "stretch", justifyContent: "center", marginTop: 8,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  authContent: { paddingHorizontal: 24 },
  authHeader: { alignItems: "center", gap: 8, marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  authTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  authSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: {
    height: 48, paddingHorizontal: 14, fontSize: 15,
    fontFamily: "Inter_400Regular", borderWidth: 1,
  },
  submitBtn: {
    height: 50, alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  switchMode: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
