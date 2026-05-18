import { Ionicons } from "@expo/vector-icons";
import { useListBlogPosts, useListDesigns } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlogCard } from "@/components/BlogCard";
import { DesignCard } from "@/components/DesignCard";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // @ts-ignore
  const { data: featuredDesigns, isLoading: loadingDesigns, refetch: refetchDesigns, isRefetching: refetchingDesigns } =
    useListDesigns({ featured: true, limit: 10 });

  // @ts-ignore
  const { data: recentPosts, isLoading: loadingPosts, refetch: refetchPosts, isRefetching: refetchingPosts } =
    useListBlogPosts({ pageSize: 6, status: "published" });

  const isRefreshing = refetchingDesigns || refetchingPosts;
  const onRefresh = () => { refetchDesigns(); refetchPosts(); };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <LinearGradient
        colors={[colors.primary + "22", colors.primary + "08", colors.background] as any}
        style={[styles.hero, { paddingTop: topPad + 24 }]}
      >
        <Text style={[styles.heroEyebrow, { color: colors.primary }]}>AI PRINT-ON-DEMAND</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Design {"&"} Blog{"\n"}Store
        </Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          Curated designs and SEO-optimized articles
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/designs")}
          style={({ pressed }) => [
            styles.heroCTA,
            { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.heroCTAText, { color: colors.primaryForeground }]}>Browse Designs</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryForeground} />
        </Pressable>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured Designs</Text>
          <Pressable onPress={() => router.push("/(tabs)/designs")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        {loadingDesigns ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={(featuredDesigns ?? []) as any[]}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => <DesignCard design={item} compact />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            scrollEnabled={!!(featuredDesigns && (featuredDesigns as any[]).length > 0)}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>No designs yet</Text>
            }
          />
        )}
      </View>

      <View style={[styles.section, styles.lastSection, Platform.OS === "web" ? { paddingBottom: 34 } : {}]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Articles</Text>
          <Pressable onPress={() => router.push("/(tabs)/blog")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        {loadingPosts ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : recentPosts && (recentPosts as any[]).length > 0 ? (
          (recentPosts as any[]).map((post: any) => <BlogCard key={post.id} post={post} horizontal />)
        ) : (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>No articles yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 36, gap: 10 },
  heroEyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  heroTitle: { fontSize: 34, fontFamily: "Inter_700Bold", lineHeight: 42 },
  heroSub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  heroCTA: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, alignSelf: "flex-start", marginTop: 4,
  },
  heroCTAText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 },
  lastSection: { paddingBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  hList: { paddingBottom: 4 },
  loader: { marginVertical: 24 },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 24 },
});
