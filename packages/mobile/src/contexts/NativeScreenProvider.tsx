import React, { createContext, useContext, useState, useEffect, useRef, RefObject } from 'react';
import { Modal, DeviceEventEmitter, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { getWebURL } from '../config/webUrl';
import { englishToKoreanFinger } from '@handy-platform/shared/src/utils/fingerMapping';
import NailSizesScreen from '../screens/NailSizesScreen';
import NailMeasurement from '../screens/NailMeasurement';
import CustomToast from '../components/CustomToast';

// ErrorBoundary: 릴리스 빌드에서 Modal 내부 크래시 방지
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ScreenErrorBoundary] Crash caught:', error.message);
    console.error('[ScreenErrorBoundary] Stack:', info.componentStack);
    // 릴리스에서도 에러 확인 가능하도록 Alert 표시
    Alert.alert(
      '오류 발생',
      `화면을 표시하는 중 오류가 발생했습니다.\n\n${error.message}`,
      [{ text: '닫기', onPress: () => this.props.onClose() }],
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.title}>오류가 발생했습니다</Text>
          <Text style={ebStyles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity style={ebStyles.button} onPress={this.props.onClose}>
            <Text style={ebStyles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#131211', marginBottom: 12 },
  message: { fontSize: 14, color: '#71717A', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#FF8FA3', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

// Context 타입 정의
interface NativeScreenContextType {
  // WebView 제어
  registerWebView: (ref: RefObject<WebView>) => void;
  navigateWebView: (url: string) => void;

  // 네이티브 화면 제어
  openNailSizes: () => void;
  openMeasurement: (hand?: 'left' | 'right', finger?: string) => void;
  closeNailSizes: () => void;
  closeMeasurement: () => void;
}

// Context 생성
const NativeScreenContext = createContext<NativeScreenContextType | undefined>(undefined);

// Provider Props
interface NativeScreenProviderProps {
  children: React.ReactNode;
}

// Provider 컴포넌트
export const NativeScreenProvider: React.FC<NativeScreenProviderProps> = ({ children }) => {
  // WebView ref 관리
  const webViewRef = useRef<WebView | null>(null);

  // 네이티브 화면 상태
  const [showNailSizes, setShowNailSizes] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [selectedFinger, setSelectedFinger] = useState<string>('엄지');
  const [nailSizesRefreshKey, setNailSizesRefreshKey] = useState(0);

  // WebView ref 등록
  const registerWebView = (ref: RefObject<WebView>) => {
    if (ref.current) {
      webViewRef.current = ref.current;
      console.log('✅ [NativeScreenProvider] WebView registered');
    }
  };

  // WebView 네비게이션
  const navigateWebView = (url: string) => {
    if (webViewRef.current) {
      console.log('🔄 [NativeScreenProvider] Navigating WebView to:', url);
      webViewRef.current.injectJavaScript(`
        console.log('Navigating to:', '${url}');
        window.location.href = '${url}';
        true;
      `);
    } else {
      console.warn('⚠️ [NativeScreenProvider] WebView not registered');
    }
  };

  // 네이티브 화면 열기
  const openNailSizes = () => {
    console.log('📱 [NativeScreenProvider] Opening Nail Sizes screen');
    setShowNailSizes(true);
  };

  const openMeasurement = (hand?: 'left' | 'right', finger?: string) => {
    console.log('📱 [NativeScreenProvider] Opening Nail Measurement screen', { hand, finger });
    if (hand) setSelectedHand(hand);
    if (finger) setSelectedFinger(englishToKoreanFinger(finger));
    setShowMeasurement(true);
  };

  const closeNailSizes = () => {
    console.log('📱 [NativeScreenProvider] Closing Nail Sizes screen');
    setShowNailSizes(false);
    // WebView에 사이즈 갱신 알림
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'NAIL_SIZE_UPDATED' }));
    }
  };

  const closeMeasurement = () => {
    console.log('📱 [NativeScreenProvider] Closing Nail Measurement screen');
    setShowMeasurement(false);
    // WebView에 사이즈 갱신 알림
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'NAIL_SIZE_UPDATED' }));
    }
  };

  // DeviceEventEmitter 리스너 설정
  useEffect(() => {
    console.log('🟢 [NativeScreenProvider] Setting up DeviceEventEmitter listeners');

    // 웹에서 네일 사이즈 화면 열기
    const navigateToSizesListener = DeviceEventEmitter.addListener(
      'navigateToSizes',
      (data) => {
        console.log('🔵 [NativeScreenProvider] navigateToSizes event received:', data);
        openNailSizes();
      }
    );

    // 웹에서 네일 측정 화면 열기
    const openMeasurementListener = DeviceEventEmitter.addListener(
      'navigateToMeasurement',
      (data: { hand?: 'left' | 'right'; finger?: string }) => {
        console.log('🔵 [NativeScreenProvider] openMeasurement event received:', data);
        openMeasurement(data.hand, data.finger);
      }
    );

    // 로그아웃 후 로그인 페이지로 이동
    const navigateToHomeAndLoginListener = DeviceEventEmitter.addListener(
      'navigateToHomeAndLogin',
      () => {
        console.log('🔵 [NativeScreenProvider] navigateToHomeAndLogin event received');
        const baseURL = getWebURL();
        const loginUrl = `${baseURL}/login`;

        // 모든 네이티브 화면 닫기
        setShowNailSizes(false);
        setShowMeasurement(false);

        // 짧은 딜레이 후 로그인 페이지로 이동
        setTimeout(() => {
          navigateWebView(loginUrl);
          console.log('✅ [NativeScreenProvider] Login navigation completed');
        }, 100);
      }
    );

    return () => {
      console.log('🔴 [NativeScreenProvider] Removing DeviceEventEmitter listeners');
      navigateToSizesListener.remove();
      openMeasurementListener.remove();
      navigateToHomeAndLoginListener.remove();
    };
  }, []);

  // Context value
  const value: NativeScreenContextType = {
    registerWebView,
    navigateWebView,
    openNailSizes,
    openMeasurement,
    closeNailSizes,
    closeMeasurement,
  };

  return (
    <NativeScreenContext.Provider value={value}>
      {children}

      {/* 네이티브 화면 모달들 */}

      {/* 손톱 사이즈 목록 Modal */}
      <Modal
        visible={showNailSizes}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={closeNailSizes}
      >
        <ScreenErrorBoundary onClose={closeNailSizes}>
          <NailSizesScreen
            onClose={closeNailSizes}
            refreshKey={nailSizesRefreshKey}
            onNavigateToCamera={(hand, finger) => {
              console.log(`🎯 [NativeScreenProvider] onNavigateToCamera called with hand: ${hand}, finger: ${finger}`);
              // iOS에서는 Modal을 동시에 2개 표시할 수 없으므로 NailSizes를 먼저 닫음
              closeNailSizes();
              setTimeout(() => {
                openMeasurement(hand, finger);
              }, 300);
            }}
          />
        </ScreenErrorBoundary>
      </Modal>

      {/* 손톱 측정 Modal */}
      <Modal
        visible={showMeasurement}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeMeasurement}
      >
        <ScreenErrorBoundary onClose={closeMeasurement}>
          <NailMeasurement
            preselectedHand={selectedHand}
            onClose={closeMeasurement}
            onNavigateToSizes={() => {
              console.log('🔵 [NativeScreenProvider] onNavigateToSizes called');
              closeMeasurement();
              openNailSizes();
              setNailSizesRefreshKey(prev => prev + 1);
            }}
          />
          <CustomToast />
        </ScreenErrorBoundary>
      </Modal>

      {/* Provider 레벨 Toast — 메인 화면에서 표시 */}
      <CustomToast />
    </NativeScreenContext.Provider>
  );
};

// Custom Hook
export const useNativeScreen = (): NativeScreenContextType => {
  const context = useContext(NativeScreenContext);
  if (!context) {
    throw new Error('useNativeScreen must be used within NativeScreenProvider');
  }
  return context;
};
