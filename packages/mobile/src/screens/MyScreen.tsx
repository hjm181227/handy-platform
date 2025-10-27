import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  BackHandler,
  ToastAndroid,
  Alert,
} from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';
import { getWebURL } from '../config/webUrl';
import { useFocusEffect } from '@react-navigation/native';
import WebViewBridge from '../components/WebViewBridge';
import { WebView } from 'react-native-webview';

const MyScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);

  const getMyPageURL = () => {
    const environment = getCurrentEnvironment();
    const baseURL = getWebURL();
    console.log(`🌐 [MyScreen] Environment: ${environment}, Base URL: ${baseURL}`);
    return `${baseURL}/my`;
  };

  // BackHandler 설정
  useFocusEffect(
    React.useCallback(() => {
      console.log('🟢 [MyScreen] Screen focused, setting up BackHandler');
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress,
      );

      return () => {
        console.log('🔴 [MyScreen] Screen unfocused, removing BackHandler');
        backHandler.remove();
      };
    }, [canGoBack])
  );

  const handleBackPress = () => {
    if (canGoBack && webViewBridgeRef.current) {
      console.log('⬅️ [MyScreen] WebView can go back, going back');
      webViewBridgeRef.current.goBack();
      return true;
    }

    const currentTime = Date.now();
    if (currentTime - lastBackPressed.current < 2000) {
      console.log('🚪 [MyScreen] Double back press, exiting app');
      BackHandler.exitApp();
      return true;
    }

    lastBackPressed.current = currentTime;
    if (Platform.OS === 'android') {
      ToastAndroid.show('뒤로 버튼을 한 번 더 누르면 종료됩니다', ToastAndroid.SHORT);
    }
    return true;
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={styles.container}>
      <WebViewBridge
        ref={webViewBridgeRef}
        url={getMyPageURL()}
        onNavigationStateChange={handleNavigationStateChange}
        onShowNativeFeatures={() => {
          console.log('🎯 [MyScreen] onShowNativeFeatures called (ignored)');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default MyScreen;
