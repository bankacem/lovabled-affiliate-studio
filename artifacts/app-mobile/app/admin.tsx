import { Ionicons } from "@expo/vector-icons";
import {
  useGetBlogStats,
  useGetDesignStats,
  useListBlogPosts,
  useListDesigns,
} from "@workspace/api-client-react";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
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

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const adminDomain = () =>
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

export default function AdminScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: blogStats, isLoading: loadingBlogStats } = useGetBlogStats();
  const { data: designStats, isLoading: loadingDesignStats } = useGetDesignStats();
  const { data: draftsResp } = useListBlogPosts({ status: "draft", pageSize: 5 } as any);
  const { data: recentDesignsResp } = useListDesigns({ limit: 5 });

  const drafts: any[] = (draftsResp as any)?.posts ?? [];
  const recentDesigns: any[] = (recentDesignsResp as any)?.designs ?? [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user?.isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.noAccessTitle, { color: colors.foreground }]}>Admin only</Text>
        <Text style={[styles.noAccessSub, { color: colors.mutedForeground }]}>
          You need admin access to view this page.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primaryForeground }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const openAdminSection = async (path: string) => {
    await WebBrowser.openBrowserAsync(`${adminDomain()}${path}`);
  };

  const StatCard = ({
    label,
    value,
    loading,
  }: {
    label: string;
    value?: number | string;
    loading?: boolean;
  }) => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[styles.statValue, { color: colors.foreground }]}>{value ?? "—"}</Text>
      )}
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Admin Dashboard</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Signed in as {user.email}
        </Text>
      </View>

      <View style={[styles.statsGrid, styles.section]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.grid}>
          <StatCard
            label="Total Posts"
            value={blogStats?.total}
            loading={loadingBlogStats}
          />
          <StatCard
            label="Published"
            value={blogStats?.published}
            loading={loadingBlogStats}
          />
          <StatCard
            label="Drafts"
            value={blogStats?.draft}
            loading={loadingBlogStats}
          />
          <StatCard
            label="Designs"
            value={designStats?.total}
            loading={loadingDesignStats}
          />
          <StatCard
            label="Featured"
            value={designStats?.featured}
            loading={loadingDesignStats}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actions}>
          {[
            {
              icon: "create-outline" as const,
              label: "Write new article",
              sub: "Open AI article editor",
              path: "/admin#posts",
            },
            {
              icon: "image-outline" as const,
              label: "Manage designs",
              sub: "Add, edit or remove designs",
              path: "/admin#designs",
            },
            {
              icon: "bar-chart-outline" as const,
              label: "Analytics",
              sub: "SEO & link performance",
              path: "/admin#analytics",
            },
            {
              icon: "storefront-outline" as const,
              label: "Store manager",
              sub: "Manage shop links",
              path: "/admin#stores",
            },
          ].map((action) => (
            <Pressable
              key={action.label}
              onPress={() => openAdminSection(action.path)}
              style={({ pressed }) => [
                styles.actionRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.primary + "14", borderRadius: 10 }]}
              >
                <Ionicons name={action.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                  {action.label}
                </Text>
                <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
                  {action.sub}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </View>

      {drafts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Draft Articles</Text>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            {drafts.map((post: any, i: number) => (
              <Pressable
                key={post.id}
                onPress={() => openAdminSection(`/admin#edit-${post.id}`)}
                style={({ pressed }) => [
                  styles.listRow,
                  i < drafts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[styles.draftDot, { backgroundColor: colors.primary }]} />
                <Text
                  style={[styles.listItemText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {post.title ?? "Untitled draft"}
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {recentDesigns.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Designs</Text>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            {recentDesigns.map((design: any, i: number) => (
              <Pressable
                key={design.id}
                onPress={() => openAdminSection(`/admin#design-${design.id}`)}
                style={({ pressed }) => [
                  styles.listRow,
                  i < recentDesigns.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.designDot,
                    {
                      backgroundColor: design.featured
                        ? colors.primary
                        : colors.mutedForeground + "40",
                    },
                  ]}
                />
                <Text
                  style={[styles.listItemText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {design.name ?? "Untitled"}
                </Text>
                {design.featured && (
                  <Ionicons name="star" size={13} color={colors.primary} />
                )}
                <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Pressable
          onPress={() => openAdminSection("/admin")}
          style={({ pressed }) => [
            styles.fullAdminBtn,
            { borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="desktop-outline" size={18} color={colors.foreground} />
          <Text style={[styles.fullAdminText, { color: colors.foreground }]}>
            Open full admin panel
          </Text>
          <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  noAccessTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  noAccessSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, gap: 4 },
  backRow: { marginBottom: 8 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  statsGrid: { paddingTop: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "28%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  actions: { gap: 10 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  actionIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  actionText: { flex: 1, gap: 2 },
  actionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  listCard: { borderWidth: 1, overflow: "hidden" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  draftDot: { width: 7, height: 7, borderRadius: 4 },
  designDot: { width: 7, height: 7, borderRadius: 4 },
  listItemText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  fullAdminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderWidth: 1,
  },
  fullAdminText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
