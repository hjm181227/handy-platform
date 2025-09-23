import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getCurrentEnvironment } from '@handy-platform/shared';

const CategoryScreen: React.FC = () => {
  const navigation = useNavigation();

  // 웹의 실제 CategoryDrawer와 동일한 카테고리 데이터
  const categories = {
    style: [
      { label: "신상", icon: "✨", path: "/cat/style/신상" },
      { label: "심플", icon: "🤍", path: "/cat/style/심플" },
      { label: "화려", icon: "💎", path: "/cat/style/화려" },
      { label: "아트", icon: "🎨", path: "/cat/style/아트" },
      { label: "트렌디", icon: "🔥", path: "/cat/style/트렌디" },
      { label: "클래식", icon: "👑", path: "/cat/style/클래식" },
      { label: "시즌", icon: "🌸", path: "/cat/style/시즌" },
      { label: "테마", icon: "🎭", path: "/cat/style/테마" },
      { label: "키치", icon: "🌈", path: "/cat/style/키치" },
      { label: "네츄럴", icon: "🌿", path: "/cat/style/네츄럴" },
    ],
    color: [
      { label: "레드 계열", icon: "🔴", path: "/cat/color/레드계열" },
      { label: "핑크 계열", icon: "🩷", path: "/cat/color/핑크계열" },
      { label: "블루 계열", icon: "🔵", path: "/cat/color/블루계열" },
      { label: "그린 계열", icon: "🟢", path: "/cat/color/그린계열" },
      { label: "뉴트럴", icon: "🤎", path: "/cat/color/뉴트럴" },
      { label: "블랙/화이트", icon: "⚫", path: "/cat/color/블랙화이트" },
    ],
    texture: [
      { label: "글리터", icon: "✨", path: "/cat/texture/글리터" },
      { label: "크롬/메탈", icon: "🪙", path: "/cat/texture/크롬메탈" },
      { label: "매트", icon: "🎯", path: "/cat/texture/매트" },
      { label: "벨벳", icon: "🧸", path: "/cat/texture/벨벳" },
      { label: "젤", icon: "💧", path: "/cat/texture/젤" },
      { label: "자석", icon: "🧲", path: "/cat/texture/자석" },
    ],
    shape: [
      { label: "라운드", icon: "⭕", path: "/cat/shape/라운드" },
      { label: "아몬드", icon: "🥜", path: "/cat/shape/아몬드" },
      { label: "오벌", icon: "🥚", path: "/cat/shape/오벌" },
      { label: "스틸레토", icon: "📍", path: "/cat/shape/스틸레토" },
      { label: "스퀘어", icon: "⬜", path: "/cat/shape/스퀘어" },
      { label: "코핀", icon: "⚰️", path: "/cat/shape/코핀" },
    ],
    length: [
      { label: "Long", icon: "📏", path: "/cat/length/Long" },
      { label: "Medium", icon: "📐", path: "/cat/length/Medium" },
      { label: "Short", icon: "📌", path: "/cat/length/Short" },
    ],
    tpo: [
      { label: "데일리", icon: "☀️", path: "/cat/tpo/데일리" },
      { label: "파티", icon: "🎉", path: "/cat/tpo/파티" },
      { label: "웨딩", icon: "💒", path: "/cat/tpo/웨딩" },
      { label: "공연", icon: "🎪", path: "/cat/tpo/공연" },
      { label: "Special day", icon: "🎁", path: "/cat/tpo/Specialday" },
    ],
    ab: [
      { label: "아티스트", icon: "👨‍🎨", path: "/cat/ab/아티스트" },
      { label: "브랜드", icon: "🏷️", path: "/cat/ab/브랜드" },
    ],
    nation: [
      { label: "K네일", icon: "🇰🇷", path: "/cat/nation/K네일" },
      { label: "J네일", icon: "🇯🇵", path: "/cat/nation/J네일" },
      { label: "A네일", icon: "🇺🇸", path: "/cat/nation/A네일" },
    ],
  };

  const handleCategoryPress = (path: string) => {
    // 해당 카테고리 페이지로 WebView 네비게이션
    const env = getCurrentEnvironment();
    const baseURL = env === 'development'
      ? 'http://10.0.2.2:3003'
      : 'http://10.0.2.2:3003';
    
    const fullUrl = `${baseURL}${path}`;
    
    // 홈 탭으로 이동하면서 해당 URL 로드
    navigation.navigate('Home' as never, { url: fullUrl } as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗂️ 카테고리</Text>
        <Text style={styles.subtitle}>원하는 스타일과 브랜드를 찾아보세요</Text>
      </View>

      {/* 스타일 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>스타일</Text>
        <View style={styles.grid}>
          {categories.style.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 컬러 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>컬러</Text>
        <View style={styles.grid}>
          {categories.color.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 텍스쳐 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>텍스쳐</Text>
        <View style={styles.grid}>
          {categories.texture.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 모양 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>모양</Text>
        <View style={styles.grid}>
          {categories.shape.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 길이 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>길이</Text>
        <View style={styles.grid}>
          {categories.length.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TPO 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TPO</Text>
        <View style={styles.grid}>
          {categories.tpo.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 아티스트/브랜드 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>아티스트/브랜드</Text>
        <View style={styles.grid}>
          {categories.ab.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 국가별 카테고리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>국가별</Text>
        <View style={styles.grid}>
          {categories.nation.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.path)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
    maxWidth: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

export default CategoryScreen;