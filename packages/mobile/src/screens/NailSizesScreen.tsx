import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { userService } from '../services/apiService';
import { englishToKoreanFinger, ALL_FINGERS_ENGLISH } from '@handy-platform/shared/src/utils/fingerMapping';
import type { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';

interface NailSizesScreenProps {
  onClose?: () => void;
  onNavigateToCamera?: (hand?: 'left' | 'right', finger?: string) => void;
  onMeasurementUpdate?: () => void;
}

const NailSizesScreen: React.FC<NailSizesScreenProps> = ({
  onClose,
  onNavigateToCamera,
  onMeasurementUpdate
}) => {
  const [nailSizeData, setNailSizeData] = useState<NailSizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 화면에 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadNailSizeData();
    }, [])
  );

  const loadNailSizeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getNailSize();

      if (response.success) {
        setNailSizeData(response.data || null);
        // 데이터 로드 완료 시 onMeasurementUpdate 호출 (MyScreen의 최근 측정 결과 업데이트)
        if (onMeasurementUpdate) {
          onMeasurementUpdate();
        }
      } else {
        throw new Error(response.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('손톱 사이즈 조회 실패:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeasureNail = (hand: 'left' | 'right', finger: string) => {
    if (onNavigateToCamera) {
      onNavigateToCamera(hand, finger);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderFingerRow = (hand: 'left' | 'right', finger: string, size: number) => {
    const fingerKorean = englishToKoreanFinger(finger);
    const isMeasured = size > 0;

    return (
      <View key={`${hand}-${finger}`} style={styles.fingerRow}>
        <Text style={styles.fingerName}>{fingerKorean}</Text>
        <View style={styles.fingerValueContainer}>
          {isMeasured ? (
            <Text style={styles.fingerValue}>{size.toFixed(1)}mm</Text>
          ) : (
            <>
              <Text style={styles.fingerValueEmpty}>-</Text>
              <TouchableOpacity
                style={styles.measureButton}
                onPress={() => handleMeasureNail(hand, finger)}
              >
                <Text style={styles.measureButtonText}>측정하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNailSizeData}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (onClose) {
              onClose();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>손톱 사이즈</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadNailSizeData}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* AR 측정하기 버튼 */}
        <TouchableOpacity
          style={styles.arMeasureButton}
          onPress={() => {
            if (onNavigateToCamera) {
              onNavigateToCamera();
            } else {
              navigation.navigate('NailMeasurement');
            }
          }}
        >
          <View style={styles.arButtonContent}>
            <Text style={styles.arButtonIcon}>📱</Text>
            <View style={styles.arButtonTexts}>
              <Text style={styles.arButtonTitle}>AR 측정하기</Text>
              <Text style={styles.arButtonSubtitle}>카메라로 정확한 측정</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 측정 일시 */}
        {nailSizeData && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>마지막 측정</Text>
            <Text style={styles.infoValue}>{formatDate(nailSizeData.measuredAt)}</Text>
          </View>
        )}

        {/* 데이터가 없을 때 */}
        {!nailSizeData && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📏</Text>
            <Text style={styles.emptyText}>아직 측정된 손톱 사이즈가 없습니다</Text>
            <TouchableOpacity
              style={styles.startMeasureButton}
              onPress={() => {
                if (onNavigateToCamera) {
                  onNavigateToCamera();
                } else {
                  navigation.navigate('NailMeasurement');
                }
              }}
            >
              <Text style={styles.startMeasureButtonText}>측정 시작하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 왼손 */}
        {nailSizeData && (
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <Text style={styles.handIcon}>🤚</Text>
              <Text style={styles.handTitle}>왼손</Text>
            </View>
            <View style={styles.fingersContainer}>
              {ALL_FINGERS_ENGLISH.map((finger) =>
                renderFingerRow('left', finger, nailSizeData.leftHand[finger])
              )}
            </View>
          </View>
        )}

        {/* 오른손 */}
        {nailSizeData && (
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <Text style={styles.handIcon}>✋</Text>
              <Text style={styles.handTitle}>오른손</Text>
            </View>
            <View style={styles.fingersContainer}>
              {ALL_FINGERS_ENGLISH.map((finger) =>
                renderFingerRow('right', finger, nailSizeData.rightHand[finger])
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 새 측정 버튼 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={styles.newMeasureButton}
          onPress={() => {
            if (onNavigateToCamera) {
              onNavigateToCamera();
            } else {
              navigation.navigate('NailMeasurement');
            }
          }}
        >
          <Text style={styles.newMeasureButtonText}>📏 새로 측정하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    marginTop: 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  startMeasureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  startMeasureButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  handSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  handIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  handTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fingersContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
  },
  fingerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fingerName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  fingerValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fingerValue: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  fingerValueEmpty: {
    color: '#666',
    fontSize: 16,
    minWidth: 60,
    textAlign: 'right',
  },
  measureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  measureButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomButton: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  newMeasureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  newMeasureButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arMeasureButton: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arButtonIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  arButtonTexts: {
    flex: 1,
  },
  arButtonTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  arButtonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});

export default NailSizesScreen;