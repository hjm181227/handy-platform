import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  BackHandler,
  ToastAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentEnvironment } from '@handy-platform/shared';
import { getWebURL } from '../config/webUrl';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WebViewBridge from '../components/WebViewBridge';
import { WebView } from 'react-native-webview';
import ARCameraScreen from './ARCameraScreen';
import NailSizesScreen from './NailSizesScreen';

interface NailMeasurement {
  id: string;
  timestamp: string;
  fingerName: string;
  width: number;
  length: number;
}

const MyScreen: React.FC = () => {
  const [showNailFeatures, setShowNailFeatures] = useState(true);
  const [recentMeasurements, setRecentMeasurements] = useState<NailMeasurement[]>([]);
  const [showWebView, setShowWebView] = useState(true); // 웹뷰를 먼저 표시
  const [showARCamera, setShowARCamera] = useState(false);
  const [showNailSizes, setShowNailSizes] = useState(false);
  const navigation = useNavigation();

  // BackHandler 관련 state 및 ref
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);

  useEffect(() => {
    loadRecentMeasurements();
  }, []);

  // MyScreen의 focus 상태 디버깅
  useFocusEffect(
    React.useCallback(() => {
      console.log('👤 [MYSCREEN] MyScreen focused');

      // 현재 활성화된 탭이 My인지 확인
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      console.log('👤 [MYSCREEN] Current route:', currentRoute.name);
      console.log('👤 [MYSCREEN] Current showWebView state:', showWebView);

      return () => {
        console.log('👤 [MYSCREEN] MyScreen blurred');
      };
    }, [showWebView])
  );

  // 하드웨어 뒤로가기 처리
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Native UI 모드일 때는 WebView 모드로 전환
        if (!showWebView) {
          setShowWebView(true);
          return true;
        }

        // WebView 모드일 때
        if (canGoBack && webViewBridgeRef.current) {
          // WebView에 히스토리가 있으면 뒤로가기
          webViewBridgeRef.current.goBack();
          return true;
        } else {
          // WebView 초기 페이지이거나 히스토리가 없을 때 - 2번 탭하면 앱 종료
          const currentTime = Date.now();
          if (currentTime - lastBackPressed.current < 2000) {
            // 2초 이내에 두 번째 뒤로가기 - 앱 종료
            BackHandler.exitApp();
            return true;
          } else {
            // 첫 번째 뒤로가기 - 토스트 메시지
            lastBackPressed.current = currentTime;
            if (Platform.OS === 'android') {
              ToastAndroid.show('한 번 더 누르면 종료됩니다', ToastAndroid.SHORT);
            }
            return true;
          }
        }
      });

      return () => backHandler.remove();
    }, [canGoBack, showWebView])
  );

  const loadRecentMeasurements = async () => {
    try {
      const stored = await AsyncStorage.getItem('nail_measurements');
      if (stored) {
        const measurements: NailMeasurement[] = JSON.parse(stored);
        setRecentMeasurements(measurements.slice(0, 3)); // 최근 3개만
      }
    } catch (error) {
      console.error('측정 기록 로드 실패:', error);
    }
  };

  // 중앙화된 웹 URL 사용 (마이페이지)
  const getMyPageURL = () => {
    return `${getWebURL()}/my`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFingerEmoji = (finger: string) => {
    const emojiMap: Record<string, string> = {
      '엄지': '👍',
      '검지': '👆',
      '중지': '🖕',
      '약지': '💍',
      '새끼': '🤙',
    };
    return emojiMap[finger] || '✋';
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  if (showWebView) {
    return (
      <View style={styles.container}>
        <WebViewBridge
          ref={webViewBridgeRef}
          url={getMyPageURL()}
          onNavigationStateChange={handleNavigationStateChange}
          onShowNativeFeatures={() => {
            console.log('🟢 [MYSCREEN] 사이즈 측정 버튼으로 네이티브로 전환');
            setShowWebView(false);
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>사이즈 측정</Text>
          <TouchableOpacity
            style={styles.webViewButton}
            onPress={() => {
              console.log('🟢 [MYSCREEN] 웹뷰로 돌아가기');
              setShowWebView(true);
            }}
          >
            <Text style={styles.webViewButtonText}>🌐</Text>
          </TouchableOpacity>
        </View>

        {/* 환영 메시지 */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>네일 사이즈 측정</Text>
            <Text style={styles.welcomeSubtitle}>정확한 측정으로 완벽한 핏을 찾아보세요</Text>
          </View>
          <View style={styles.welcomeIcon}>
            <Text style={styles.welcomeEmoji}>💅✨</Text>
          </View>
        </View>


        {/* 측정 기능 섹션 */}
        {showNailFeatures && (
          <View style={styles.nailSection}>
            <Text style={styles.sectionTitle}>측정 시작하기</Text>
            
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => setShowARCamera(true)}
              >
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📱</Text>
                </View>
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>AR 측정하기</Text>
                  <Text style={[styles.buttonSubtext, styles.primaryButtonSubtext]}>카메라로 정확한 측정</Text>
                </View>
                <View style={styles.buttonArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setShowNailSizes(true)}
              >
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📊</Text>
                </View>
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>측정 기록</Text>
                  <Text style={[styles.buttonSubtext, styles.secondaryButtonSubtext]}>
                    {recentMeasurements.length}개의 기록 보기
                  </Text>
                </View>
                <View style={styles.buttonArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 최근 측정 결과 카드 */}
            {recentMeasurements.length > 0 && (
              <View style={styles.recentMeasurements}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>최근 측정 결과</Text>
                  <TouchableOpacity 
                    style={styles.viewAllMiniButton}
                    onPress={() => setShowNailSizes(true)}
                  >
                    <Text style={styles.viewAllMiniButtonText}>전체보기</Text>
                  </TouchableOpacity>
                </View>
                
                {recentMeasurements.slice(0, 3).map((measurement, index) => (
                  <View key={measurement.id} style={styles.recentCard}>
                    <View style={styles.recentCardLeft}>
                      <View style={styles.fingerInfo}>
                        <Text style={styles.fingerEmoji}>{getFingerEmoji(measurement.fingerName)}</Text>
                        <Text style={styles.fingerName}>{measurement.fingerName}</Text>
                      </View>
                      <Text style={styles.recentDate}>{formatDate(measurement.timestamp)}</Text>
                    </View>
                    <View style={styles.recentCardRight}>
                      <Text style={styles.sizeValue}>{measurement.width}×{measurement.length}</Text>
                      <Text style={styles.sizeUnit}>mm</Text>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowNailSizes(true)}
                >
                  <Text style={styles.viewAllButtonText}>모든 기록 보기</Text>
                  <Text style={styles.viewAllButtonIcon}>📋</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* 측정이 없을 때 안내 */}
            {recentMeasurements.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📏</Text>
                <Text style={styles.emptyTitle}>아직 측정 기록이 없어요</Text>
                <Text style={styles.emptySubtitle}>AR 측정을 시작해서 정확한 네일 사이즈를 알아보세요!</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowARCamera(true)}
                >
                  <Text style={styles.emptyButtonText}>첫 측정하기 🚀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* AR 카메라 Modal */}
      <Modal
        visible={showARCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowARCamera(false)}
      >
        <ARCameraScreen 
          onClose={() => setShowARCamera(false)}
          onNavigateToSizes={() => {
            setShowARCamera(false);
            setShowNailSizes(true);
          }}
        />
      </Modal>

      {/* 네일 사이즈 기록 Modal */}
      <Modal
        visible={showNailSizes}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowNailSizes(false)}
      >
        <NailSizesScreen 
          onClose={() => setShowNailSizes(false)}
          onNavigateToCamera={() => {
            setShowNailSizes(false);
            setShowARCamera(true);
          }}
          onMeasurementUpdate={loadRecentMeasurements}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  webViewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewButtonText: {
    fontSize: 20,
  },
  webViewHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backToNativeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backToNativeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  nailSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  buttonColumn: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    minHeight: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  buttonSubtext: {
    fontSize: 12,
  },
  primaryButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryButtonSubtext: {
    color: '#666',
  },
  recentMeasurements: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  recentFinger: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recentSize: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  recentDate: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  otherSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  menuIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  menuArrow: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  
  // 새로운 UI 스타일들
  welcomeSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeHeader: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  welcomeIcon: {
    marginLeft: 16,
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  
  // 통계 섹션
  statsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    opacity: 0.3,
  },
  
  // 개선된 버튼 스타일
  buttonIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // 최근 측정 결과 개선
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllMiniButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllMiniButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  recentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentCardLeft: {
    flex: 1,
  },
  fingerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fingerEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  fingerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  recentCardRight: {
    alignItems: 'flex-end',
  },
  sizeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sizeUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  viewAllButtonIcon: {
    fontSize: 16,
  },
  
  // 빈 상태 스타일
  emptyState: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyScreen;