import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getWebURL } from '../config/webUrl';
import WebViewBridge from '../components/WebViewBridge';

const LikeScreen: React.FC = () => {
  // 중앙화된 웹 URL 사용 (찜 목록 페이지)
  const getLikesPageURL = () => {
    return `${getWebURL()}/likes`;
  };

  return (
    <View style={styles.container}>
      <WebViewBridge url={getLikesPageURL()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default LikeScreen;