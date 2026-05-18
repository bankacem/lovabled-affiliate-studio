import { useListDesignCategories, useListDesigns } from "@workspace/api-client-react";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignCard } from "@/components/DesignCard";
import { useColors } from "@/hooks/useColors";

export default function DesignsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // @ts-ignore
  const { data: categories } = useListDesignCategories();

  // @ts-ignore
  const { data: designs, isLoading, refetch, isRefetching } = useListDesigns(
    selectedCategory !== "all" ? { category: selectedCategory, limit: 50 } : { limit: 50 }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const allCategories = ["all", ...((categories as string[] | undefined) ?? [])];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Designs</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          style={styles.pillsScroll}
        >
          {allCategories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderRadius: 20,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
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
          data={(designs ?? []) as any[]}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardWrap}>
              <DesignCard design={item} />
            </View>
          )}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            Platform.OS === "web" ? { paddingBottom: 34 } : {},
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No designs found
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pillsScroll: { marginHorizontal: -20 },
  pills: { gap: 8, paddingHorizontal: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 7 },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  loader: { flex: 1, marginTop: 40 },
  list: { padding: 16, gap: 0 },
  row: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  emptyBox: { flex: 1, alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
