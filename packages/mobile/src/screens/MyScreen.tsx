import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Platform,
  Modal 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentEnvironment } from '@handy-platform/shared';
import WebViewBridge from '../components/WebViewBridge';
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
  const [showWebView, setShowWebView] = useState(false);
  const [showARCamera, setShowARCamera] = useState(false);
  const [showNailSizes, setShowNailSizes] = useState(false);

  useEffect(() => {
    loadRecentMeasurements();
  }, []);

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

  const getWebURL = () => {
    const env = getCurrentEnvironment();
    const baseURL = env === 'development'
      ? (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001')
      : (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');
    
    return `${baseURL}/my`;
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

  if (showWebView) {
    return (
      <View style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.backToNativeButton}
            onPress={() => setShowWebView(false)}
          >
            <Text style={styles.backToNativeButtonText}>📱 앱 기능 보기</Text>
          </TouchableOpacity>
        </View>
        <WebViewBridge url={getWebURL()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>마이페이지</Text>
          <TouchableOpacity
            style={styles.webViewButton}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.webViewButtonText}>🌐</Text>
          </TouchableOpacity>
        </View>

        {/* 네일 사이즈 기능 섹션 */}
        {showNailFeatures && (
          <View style={styles.nailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📏 네일 사이즈 측정</Text>
              <Text style={styles.sectionSubtitle}>AR 카메라로 정확한 네일 사이즈를 측정하세요</Text>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => setShowARCamera(true)}
              >
                <Text style={styles.buttonIcon}>📱</Text>
                <Text style={[styles.buttonText, styles.primaryButtonText]}>AR 측정하기</Text>
                <Text style={[styles.buttonSubtext, styles.primaryButtonSubtext]}>카메라로 측정</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setShowNailSizes(true)}
              >
                <Text style={styles.buttonIcon}>📊</Text>
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>측정 기록</Text>
                <Text style={[styles.buttonSubtext, styles.secondaryButtonSubtext]}>
                  {recentMeasurements.length}개 기록
                </Text>
              </TouchableOpacity>
            </View>

            {/* 최근 측정 결과 미리보기 */}
            {recentMeasurements.length > 0 && (
              <View style={styles.recentMeasurements}>
                <Text style={styles.recentTitle}>최근 측정 결과</Text>
                {recentMeasurements.map((measurement, index) => (
                  <View key={measurement.id} style={styles.recentItem}>
                    <Text style={styles.recentFinger}>
                      {getFingerEmoji(measurement.fingerName)} {measurement.fingerName}
                    </Text>
                    <Text style={styles.recentSize}>
                      {measurement.width}×{measurement.length}mm
                    </Text>
                    <Text style={styles.recentDate}>
                      {formatDate(measurement.timestamp)}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowNailSizes(true)}
                >
                  <Text style={styles.viewAllButtonText}>전체 기록 보기 →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 다른 마이페이지 기능들 */}
        <View style={styles.otherSection}>
          <Text style={styles.sectionTitle}>기타 기능</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.menuIcon}>🛍️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>주문 내역</Text>
              <Text style={styles.menuSubtitle}>주문 상품과 배송 현황을 확인하세요</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.menuIcon}>💳</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>결제 수단</Text>
              <Text style={styles.menuSubtitle}>카드 정보와 결제 내역 관리</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.menuIcon}>🎁</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>쿠폰 및 적립금</Text>
              <Text style={styles.menuSubtitle}>할인 혜택을 확인하세요</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>설정</Text>
              <Text style={styles.menuSubtitle}>알림, 계정 정보 설정</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>
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
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
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
});

export default MyScreen;