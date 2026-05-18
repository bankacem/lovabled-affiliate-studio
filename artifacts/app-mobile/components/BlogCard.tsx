import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  author_name: string;
  category: string;
  published_at?: string | null;
  read_time?: string | null;
}

interface BlogCardProps {
  post: BlogPost;
  horizontal?: boolean;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogCard({ post, horizontal = false }: BlogCardProps) {
  const colors = useColors();
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/blog/${post.slug}` as any);
  };

  if (horizontal) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.hCard,
          {
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        {post.featured_image ? (
          <Image
            source={{ uri: post.featured_image }}
            style={[styles.hImage, { borderRadius: colors.radius - 2 }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.hImage,
              styles.hImagePlaceholder,
              { backgroundColor: colors.muted, borderRadius: colors.radius - 2 },
            ]}
          />
        )}
        <View style={styles.hContent}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.primary + "18", borderRadius: 6 },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {post.category}
            </Text>
          </View>
          <Text
            style={[styles.hTitle, { color: colors.foreground }]}
            numberOfLines={3}
          >
            {post.title}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {formatDate(post.published_at)}
            {post.read_time ? ` · ${post.read_time}` : ""}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.vCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {post.featured_image && (
        <Image
          source={{ uri: post.featured_image }}
          style={[styles.vImage, { borderRadius: colors.radius - 2 }]}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={styles.vContent}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: colors.primary + "18", borderRadius: 6 },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {post.category}
          </Text>
        </View>
        <Text
          style={[styles.vTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {post.title}
        </Text>
        {post.excerpt && (
          <Text
            style={[styles.excerpt, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {post.excerpt}
          </Text>
        )}
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {post.author_name} · {formatDate(post.published_at)}
          {post.read_time ? ` · ${post.read_time}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hCard: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  hImage: {
    width: 100,
    height: 100,
    margin: 10,
    flexShrink: 0,
  },
  hImagePlaceholder: {
    width: 100,
    height: 100,
    margin: 10,
    flexShrink: 0,
  },
  hContent: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    gap: 4,
  },
  hTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  vCard: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  vImage: {
    width: "100%",
    height: 180,
  },
  vContent: {
    padding: 14,
    gap: 6,
  },
  vTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
