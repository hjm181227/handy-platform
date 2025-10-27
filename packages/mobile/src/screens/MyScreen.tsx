import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Platform,
  BackHandler,
  ToastAndroid,
  Alert,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentEnvironment } from '@handy-platform/shared';
import { getWebURL } from '../config/webUrl';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WebViewBridge from '../components/WebViewBridge';
import { WebView } from 'react-native-webview';
import NailSizesScreen from './NailSizesScreen';
import NailMeasurement from './NailMeasurement';
import { englishToKoreanFinger } from '@handy-platform/shared/src/utils/fingerMapping';

const MyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [showNailSizes, setShowNailSizes] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [selectedFinger, setSelectedFinger] = useState<string>('엄지');
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);

  const getMyPageURL = () => {
    const environment = getCurrentEnvironment();
    const baseURL = getWebURL();
    console.log(`🌐 [MyScreen] Environment: ${environment}, Base URL: ${baseURL}`);
    return `${baseURL}/my`;
  };

  // DeviceEventEmitter 리스너 설정 - 웹에서 네이티브 화면 열기
  useEffect(() => {
    console.log('🟢 [MyScreen] Setting up DeviceEventEmitter listeners');

    const navigateToSizesListener = DeviceEventEmitter.addListener(
      'navigateToSizes',
      (data) => {
        console.log('🔵 [MyScreen] navigateToSizes event received:', data);
        setShowNailSizes(true);
      }
    );

    return () => {
      console.log('🔴 [MyScreen] Removing DeviceEventEmitter listeners');
      navigateToSizesListener.remove();
    };
  }, []);

  // 로그아웃 후 홈 탭으로 이동 및 로그인 화면 표시
  useEffect(() => {
    console.log('🟢 [MyScreen] Setting up logout navigation listener');

    const logoutListener = DeviceEventEmitter.addListener(
      'navigateToHomeAndLogin',
      () => {
        console.log('🔵 [MyScreen] navigateToHomeAndLogin event received');
        console.log('🔵 [MyScreen] Navigating to Home tab...');

        // 홈 탭으로 전환
        navigation.navigate('Home' as never);

        // 홈 탭의 WebView를 로그인 페이지로 이동
        const baseURL = getWebURL();
        const loginUrl = `${baseURL}/login`;
        console.log('🔵 [MyScreen] Emitting navigateToUrl event with:', loginUrl);

        // 짧은 딜레이 후 URL 네비게이션 이벤트 발생 (탭 전환 후 실행되도록)
        setTimeout(() => {
          DeviceEventEmitter.emit('navigateToUrl', { url: loginUrl });
          console.log('✅ [MyScreen] Login navigation event emitted');
        }, 100);
      }
    );

    return () => {
      console.log('🔴 [MyScreen] Removing logout navigation listener');
      logoutListener.remove();
    };
  }, [navigation]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebViewBridge
        ref={webViewBridgeRef}
        url={getMyPageURL()}
        onNavigationStateChange={handleNavigationStateChange}
        onShowNativeFeatures={() => {
          console.log('🎯 [MyScreen] onShowNativeFeatures called (ignored)');
        }}
      />

      {/* 손톱 사이즈 목록 Modal */}
      <Modal
        visible={showNailSizes}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowNailSizes(false)}
      >
        <NailSizesScreen
          onClose={() => {
            console.log('🔵 [MyScreen] NailSizesScreen onClose called');
            setShowNailSizes(false);
          }}
          onNavigateToCamera={(hand, finger) => {
            console.log(`🎯 [MyScreen] onNavigateToCamera called with hand: ${hand}, finger: ${finger}`);
            if (hand && finger) {
              // 개별 손가락 측정: 파라미터 사용
              setSelectedHand(hand);
              setSelectedFinger(englishToKoreanFinger(finger));
            }
            // else: AR 측정하기: 기본값 유지 (right, 엄지)
            setShowMeasurement(true);
          }}
        />
      </Modal>

      {/* 손톱 측정 Modal */}
      <Modal
        visible={showMeasurement}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMeasurement(false)}
      >
        <NailMeasurement
          preselectedHand={selectedHand}
          preselectedFinger={selectedFinger}
          onClose={() => {
            console.log('🔵 [MyScreen] NailMeasurement onClose called');
            setShowMeasurement(false);
          }}
          onNavigateToSizes={() => {
            console.log('🔵 [MyScreen] onNavigateToSizes called');
            setShowMeasurement(false);
            setShowNailSizes(true);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default MyScreen;
