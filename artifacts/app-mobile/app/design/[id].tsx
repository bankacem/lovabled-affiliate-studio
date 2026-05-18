import { Ionicons } from "@expo/vector-icons";
import { useGetDesign } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function DesignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: design, isLoading, isError } = useGetDesign(id as string);

  const openUrl = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(url);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !design) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Design not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const d = design as any;
  const shopLinks = [
    d.teepublic_url && { label: "TeePublic", url: d.teepublic_url, icon: "shirt-outline" as const },
    d.redbubble_url && { label: "Redbubble", url: d.redbubble_url, icon: "color-palette-outline" as const },
    d.amazon_url && { label: "Amazon", url: d.amazon_url, icon: "logo-amazon" as const },
    d.etsy_url && { label: "Etsy", url: d.etsy_url, icon: "storefront-outline" as const },
  ].filter(Boolean) as { label: string; url: string; icon: any }[];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Image
          source={{ uri: d.image_url || "https://placehold.co/800x800/EA6262/FFFFFF?text=Design" }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            {
              top: topPad + 12,
              backgroundColor: colors.background + "e8",
              borderRadius: 20,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 32 }]}>
        <View style={styles.meta}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.primary + "18", borderRadius: 6 },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.primary }]}>{d.category}</Text>
          </View>
          {d.featured && (
            <View style={[styles.featuredBadge, { backgroundColor: colors.primary + "18", borderRadius: 6 }]}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={[styles.featuredText, { color: colors.primary }]}>Featured</Text>
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.foreground }]}>{d.name}</Text>

        {d.description && (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{d.description}</Text>
        )}

        {d.tags && d.tags.length > 0 && (
          <View style={styles.tags}>
            {d.tags.slice(0, 6).map((tag: string) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: colors.muted, borderRadius: 6 },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {shopLinks.length > 0 ? (
          <View style={styles.shopSection}>
            <Text style={[styles.shopLabel, { color: colors.foreground }]}>Shop this design</Text>
            <View style={styles.shopButtons}>
              {shopLinks.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => openUrl(link.url)}
                  style={({ pressed }) => [
                    styles.shopBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name={link.icon} size={16} color={colors.primaryForeground} />
                  <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>
                    {link.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.noShopBox,
              { backgroundColor: colors.muted, borderRadius: colors.radius },
            ]}
          >
            <Ionicons name="storefront-outline" size={24} color={colors.mutedForeground} />
            <Text style={[styles.noShopText, { color: colors.mutedForeground }]}>
              Shop links coming soon
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  image: { width: "100%", height: 380 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 14 },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
  featuredText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 34 },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shopSection: { gap: 12, marginTop: 8 },
  shopLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  shopButtons: { gap: 10 },
  shopBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
  },
  shopBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  noShopBox: { alignItems: "center", justifyContent: "center", gap: 8, padding: 24, marginTop: 8 },
  noShopText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  retryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
