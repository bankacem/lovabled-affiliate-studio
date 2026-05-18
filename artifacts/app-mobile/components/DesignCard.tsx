import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Design {
  id: string;
  name: string;
  description?: string | null;
  image_url: string;
  category: string;
  featured: boolean;
  teepublic_url?: string | null;
  redbubble_url?: string | null;
}

interface DesignCardProps {
  design: Design;
  compact?: boolean;
}

export function DesignCard({ design, compact = false }: DesignCardProps) {
  const colors = useColors();
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/design/${design.id}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
          width: compact ? 180 : undefined,
        },
      ]}
    >
      <Image
        source={{ uri: design.image_url || "https://placehold.co/400x400/EA6262/FFFFFF?text=Design" }}
        style={[styles.image, { borderRadius: colors.radius - 2, height: compact ? 160 : 200 }]}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {design.name}
        </Text>
        <View style={styles.footer}>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.muted, borderRadius: 6 },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
              {design.category}
            </Text>
          </View>
          {design.featured && (
            <Ionicons name="star" size={14} color={colors.primary} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
  },
  info: {
    padding: 12,
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
});
