import { Ionicons } from "@expo/vector-icons";
import { useListBlogCategories, useListBlogPosts } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlogCard } from "@/components/BlogCard";
import { useColors } from "@/hooks/useColors";

export default function BlogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Returns BlogCategory[] — each has .name, .slug
  const { data: categories } = useListBlogCategories();

  const { data: postsResp, isLoading, refetch, isRefetching } = useListBlogPosts({
    status: "published",
    pageSize: 50,
    ...(selectedCategory !== "all" ? { category: selectedCategory } : {}),
    ...(search.length > 1 ? { search } : {}),
  } as any);

  // Unwrap paginated response
  const posts: any[] = (postsResp as any)?.posts ?? [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  // categories is BlogCategory[] — extract names
  const categoryNames: string[] = ((categories as any[] | undefined) ?? []).map((c: any) => c.name ?? c);
  const allCategories = ["all", ...categoryNames];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Blog</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search articles..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          style={styles.pillsScroll}
        >
          {allCategories.map((cat: string) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.pill, { backgroundColor: active ? colors.primary : colors.muted, borderRadius: 20 }]}
              >
                <Text
                  style={[styles.pillText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}
                >
                  {cat === "all" ? "All" : cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => <BlogCard post={item} />}
          contentContainerStyle={[styles.list, Platform.OS === "web" ? { paddingBottom: 34 } : {}]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? "No articles match your search" : "No articles yet"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  pillsScroll: { marginHorizontal: -20 },
  pills: { gap: 8, paddingHorizontal: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 7 },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  loader: { flex: 1, marginTop: 40 },
  list: { padding: 16 },
  emptyBox: { flex: 1, alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
