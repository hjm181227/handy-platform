import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getWebURL } from '../config/webUrl';
import WebViewBridge from '../components/WebViewBridge';

const SnapScreen: React.FC = () => {
  // 중앙화된 웹 URL 사용 (스냅 페이지)
  const getSnapPageURL = () => {
    return `${getWebURL()}/snap`;
  };

  return (
    <View style={styles.container}>
      <WebViewBridge url={getSnapPageURL()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default SnapScreen;