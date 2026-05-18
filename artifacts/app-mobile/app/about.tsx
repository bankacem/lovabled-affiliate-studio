import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FEATURES = [
  {
    icon: "shirt-outline" as const,
    title: "Print-on-Demand Designs",
    desc: "Browse AI-curated designs for T-shirts, mugs, stickers, and more — linking directly to TeePublic and Redbubble.",
  },
  {
    icon: "document-text-outline" as const,
    title: "SEO-Optimized Blog",
    desc: "Explore articles generated and optimized with AI — covering design trends, creative inspiration, and print culture.",
  },
  {
    icon: "sparkles-outline" as const,
    title: "AI-Powered Content",
    desc: "Every design and article is created or curated using state-of-the-art AI (OpenRouter, Groq, OpenAI) for quality and relevance.",
  },
  {
    icon: "bar-chart-outline" as const,
    title: "Analytics & Insights",
    desc: "Behind the scenes, our admin tools track what resonates — so the store keeps getting better over time.",
  },
];

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const openWeb = async () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;
    await WebBrowser.openBrowserAsync(`https://${domain}/about`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
    >
      <Pressable
        onPress={() => router.back()}
        style={[styles.backRow, { paddingTop: topPad + 16, paddingHorizontal: 20 }]}
      >
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
      </Pressable>

      <View style={styles.heroSection}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="color-palette-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>AIPrintVerse</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          AI-powered print-on-demand designs and SEO blog — all in one place.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View
            key={f.title}
            style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + "14" }]}>
              <Ionicons name={f.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={openWeb}
        style={({ pressed }) => [
          styles.webBtn,
          { borderColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Ionicons name="open-outline" size={16} color={colors.primary} />
        <Text style={[styles.webBtnText, { color: colors.primary }]}>Open full site on web</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: { marginBottom: 8 },
  heroSection: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 28, gap: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  features: { paddingHorizontal: 20, gap: 12 },
  featureCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    padding: 16, borderWidth: 1,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featureDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  webBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderWidth: 1,
    marginHorizontal: 20, marginTop: 24,
  },
  webBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 20 },
});
