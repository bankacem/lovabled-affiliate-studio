import { Ionicons } from "@expo/vector-icons";
import { useGetBlogPostBySlug } from "@workspace/api-client-react";
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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: post, isLoading, isError } = useGetBlogPostBySlug(slug as string);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const openWeb = async () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(`https://${domain}/blog/${slug}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !post) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Article not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn2, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={[styles.backBtn2Text, { color: colors.primaryForeground }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const p = post as any;
  const content = p.content ? stripHtml(p.content) : p.excerpt || "";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {p.featured_image && (
        <View>
          <Image
            source={{ uri: p.featured_image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtnOverlay, { top: topPad + 12, backgroundColor: colors.background + "e8", borderRadius: 20 }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      )}

      <View style={[styles.content, { paddingBottom: bottomPad + 32 }]}>
        {!p.featured_image && (
          <Pressable onPress={() => router.back()} style={[styles.inlineBack, { paddingTop: topPad + 12 }]}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
        )}

        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "18", borderRadius: 6 }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{p.category}</Text>
          </View>
          {p.read_time && (
            <Text style={[styles.readTime, { color: colors.mutedForeground }]}>
              {p.read_time}
            </Text>
          )}
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{p.title}</Text>

        <View style={styles.authorRow}>
          <View style={[styles.authorDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.authorName, { color: colors.mutedForeground }]}>{p.author_name}</Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(p.published_at)}</Text>
        </View>

        {p.excerpt && !p.content && (
          <Text style={[styles.excerpt, { color: colors.mutedForeground }]}>{p.excerpt}</Text>
        )}

        {content ? (
          <Text style={[styles.body, { color: colors.foreground }]}>{content}</Text>
        ) : null}

        {p.tags && p.tags.length > 0 && (
          <View style={styles.tags}>
            {p.tags.slice(0, 5).map((tag: string) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted, borderRadius: 6 }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={openWeb}
          style={({ pressed }) => [
            styles.openWebBtn,
            { borderColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="open-outline" size={16} color={colors.primary} />
          <Text style={[styles.openWebText, { color: colors.primary }]}>Read full article on web</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  heroImage: { width: "100%", height: 280 },
  backBtnOverlay: {
    position: "absolute", left: 16, width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
  },
  inlineBack: { marginBottom: 8 },
  content: { padding: 20, gap: 14 },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  readTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 34 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  authorDot: { width: 6, height: 6, borderRadius: 3 },
  authorName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dot: { fontSize: 13 },
  date: { fontSize: 13, fontFamily: "Inter_400Regular" },
  excerpt: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 26, fontStyle: "italic" },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 26 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  openWebBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderWidth: 1, marginTop: 8,
  },
  openWebText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backBtn2: { paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  backBtn2Text: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
