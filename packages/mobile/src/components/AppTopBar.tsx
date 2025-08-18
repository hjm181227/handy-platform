// src/components/AppTopBar.tsx
import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabItem = { key: string; label: string; path: string };

export default function AppTopBar({
  onSelectPath,
}: {
  onSelectPath: (path: string) => void;
}) {
  // 쇼핑몰 탭/경로 매핑
  const tabs: TabItem[] = [
    { key: "home", label: "홈", path: "/" },
    { key: "category", label: "카테고리", path: "/categories" },
    { key: "search", label: "검색", path: "/search" },
    { key: "cart", label: "장바구니", path: "/cart" },
    { key: "profile", label: "마이페이지", path: "/profile" },
  ];

  const [active, setActive] = React.useState(tabs[0].key);
  const [q, setQ] = React.useState("");

  const go = (t: TabItem) => {
    setActive(t.key);
    onSelectPath(t.path);
  };

  return (
    <SafeAreaView edges={["top"]} style={S.wrap}>
      {/* 1) 상단 로고행 */}
      <View style={S.rowTop}>
        <Text style={S.logo}>HANDY</Text>

        <View style={S.actions}>
          {/* QR 스캔 버튼 */}
          <Pressable onPress={() => onSelectPath("/qr-scan")}>
            <Text style={S.iconTxt}>📷</Text>
          </Pressable>
          {/* 알림 */}
          <Pressable onPress={() => onSelectPath("/notifications")}>
            <Text style={S.iconTxt}>🔔</Text>
          </Pressable>
          {/* 장바구니 */}
          <Pressable onPress={() => onSelectPath("/cart")}>
            <Text style={S.iconTxt}>🛒</Text>
          </Pressable>
        </View>
      </View>

      {/* 2) 검색바 */}
      <View style={S.searchBar}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="상품을 검색해보세요"
          placeholderTextColor="#9AA0A6"
          style={S.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (q.trim()) onSelectPath(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        />
        <Pressable
          onPress={() => onSelectPath(`/search?q=${encodeURIComponent(q.trim())}`)}
          style={S.searchBtn}
          hitSlop={10}
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
        </Pressable>
      </View>

      {/* 3) 탭 라인 (가로 스크롤) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.tabs}
      >
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <Pressable key={t.key} onPress={() => go(t)} style={S.tabBtn}>
              <Text style={[S.tabText, isActive && S.tabActive]}>{t.label}</Text>
              {isActive ? <View style={S.indicator} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  wrap: { backgroundColor: "#2563eb" }, // 파란색 테마
  rowTop: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { color: "white", fontSize: 28, fontWeight: "700", letterSpacing: 1 },
  actions: { flexDirection: "row", gap: 16, alignItems: "center" },
  iconTxt: { fontSize: 20 },
  searchBar: {
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 8,
    height: 42,
  },
  searchInput: { flex: 1, color: "#111", fontSize: 15, paddingVertical: 0 },
  searchBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  tabs: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 22,
    alignItems: "flex-end",
  },
  tabBtn: { alignItems: "center" },
  tabText: { color: "#bfbfbf", fontSize: 18, fontWeight: "600" },
  tabActive: { color: "white" },
  indicator: { marginTop: 6, height: 2, width: 18, backgroundColor: "white", borderRadius: 1 },
});