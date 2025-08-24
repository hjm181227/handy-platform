import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';
import WebViewBridge from '../components/WebViewBridge';

const LikeScreen: React.FC = () => {
  // 환경별 웹 URL 설정 (찜 목록 페이지)
  const getWebURL = () => {
    const env = getCurrentEnvironment();
    const baseURL = env === 'development'
      ? (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001')
      : (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');
    
    return `${baseURL}/likes`;
  };

  return (
    <View style={styles.container}>
      <WebViewBridge url={getWebURL()} />
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