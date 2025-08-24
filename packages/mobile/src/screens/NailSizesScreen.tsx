import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface NailMeasurement {
  id: string;
  timestamp: string;
  fingerName: string;
  width: number; // mm
  length: number; // mm
  imageUri?: string;
}

interface NailSizesScreenProps {
  onClose?: () => void;
  onNavigateToCamera?: () => void;
  onMeasurementUpdate?: () => void;
}

const NailSizesScreen: React.FC<NailSizesScreenProps> = ({ 
  onClose, 
  onNavigateToCamera, 
  onMeasurementUpdate 
}) => {
  const [measurements, setMeasurements] = useState<NailMeasurement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<string>('전체');

  const fingers = ['전체', '엄지', '검지', '중지', '약지', '새끼'];

  const loadMeasurements = async () => {
    try {
      const stored = await AsyncStorage.getItem('nail_measurements');
      if (stored) {
        const data: NailMeasurement[] = JSON.parse(stored);
        setMeasurements(data);
      } else {
        setMeasurements([]);
      }
    } catch (error) {
      console.error('측정 기록 로드 실패:', error);
      Alert.alert('오류', '측정 기록을 불러오는데 실패했습니다.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasurements();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeasurements();
    setRefreshing(false);
  };

  const deleteMeasurement = async (id: string) => {
    Alert.alert(
      '측정 기록 삭제',
      '이 측정 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const filtered = measurements.filter(m => m.id !== id);
              await AsyncStorage.setItem('nail_measurements', JSON.stringify(filtered));
              setMeasurements(filtered);
              if (onMeasurementUpdate) {
                onMeasurementUpdate();
              }
            } catch (error) {
              console.error('삭제 실패:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const clearAllMeasurements = async () => {
    Alert.alert(
      '전체 삭제',
      '모든 측정 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('nail_measurements');
              setMeasurements([]);
              if (onMeasurementUpdate) {
                onMeasurementUpdate();
              }
            } catch (error) {
              console.error('전체 삭제 실패:', error);
              Alert.alert('오류', '전체 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
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

  const getFilteredMeasurements = () => {
    if (selectedFinger === '전체') {
      return measurements;
    }
    return measurements.filter(m => m.fingerName === selectedFinger);
  };

  const getAverageSize = () => {
    const filtered = getFilteredMeasurements();
    if (filtered.length === 0) return null;

    const avgWidth = filtered.reduce((sum, m) => sum + m.width, 0) / filtered.length;
    const avgLength = filtered.reduce((sum, m) => sum + m.length, 0) / filtered.length;

    return {
      width: Math.round(avgWidth * 10) / 10,
      length: Math.round(avgLength * 10) / 10,
    };
  };

  const filtered = getFilteredMeasurements();
  const average = getAverageSize();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>내 네일 사이즈</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onNavigateToCamera}
        >
          <Text style={styles.addButtonText}>📏</Text>
        </TouchableOpacity>
      </View>

      {/* 통계 정보 */}
      {measurements.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 측정 통계</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총 측정 수</Text>
              <Text style={styles.statValue}>{measurements.length}회</Text>
            </View>
            {average && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>평균 너비</Text>
                  <Text style={styles.statValue}>{average.width}mm</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>평균 길이</Text>
                  <Text style={styles.statValue}>{average.length}mm</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* 필터 버튼 */}
      {measurements.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {fingers.map((finger) => (
                <TouchableOpacity
                  key={finger}
                  style={[
                    styles.filterButton,
                    selectedFinger === finger && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFinger(finger)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFinger === finger && styles.filterButtonTextActive,
                    ]}
                  >
                    {finger === '전체' ? '전체' : `${getFingerEmoji(finger)} ${finger}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 측정 기록 목록 */}
      <ScrollView
        style={styles.measurementsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📏</Text>
            <Text style={styles.emptyTitle}>
              {measurements.length === 0
                ? '아직 측정한 네일 사이즈가 없습니다'
                : `${selectedFinger} 손가락의 측정 기록이 없습니다`}
            </Text>
            <Text style={styles.emptySubtitle}>
              AR 카메라로 네일 사이즈를 측정해 보세요!
            </Text>
            <TouchableOpacity
              style={styles.measureButton}
              onPress={onNavigateToCamera}
            >
              <Text style={styles.measureButtonText}>📏 사이즈 측정하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {filtered.map((measurement, index) => (
              <View key={measurement.id} style={styles.measurementCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>
                      {getFingerEmoji(measurement.fingerName)} {measurement.fingerName} 손가락
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteMeasurement(measurement.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardDate}>
                    {formatDate(measurement.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.measurementRow}>
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>너비</Text>
                      <Text style={styles.measurementValue}>
                        {measurement.width}mm
                      </Text>
                    </View>
                    <View style={styles.measurementDivider} />
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>길이</Text>
                      <Text style={styles.measurementValue}>
                        {measurement.length}mm
                      </Text>
                    </View>
                  </View>
                  
                  {/* 사이즈 추천 */}
                  <View style={styles.recommendationContainer}>
                    <Text style={styles.recommendationTitle}>💡 추천 네일 사이즈</Text>
                    <View style={styles.recommendationRow}>
                      <Text style={styles.recommendationText}>
                        {measurement.width < 10 ? 'XS' : 
                         measurement.width < 11 ? 'S' :
                         measurement.width < 12 ? 'M' :
                         measurement.width < 13 ? 'L' : 'XL'} 사이즈 ({measurement.width}mm 기준)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* 전체 삭제 버튼 */}
            {measurements.length > 1 && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearAllMeasurements}
                >
                  <Text style={styles.clearAllButtonText}>전체 기록 삭제</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  measurementsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  measureButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  measureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  measurementCard: {
    backgroundColor: '#fff',
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 15,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  cardContent: {},
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
  measurementDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9ecef',
    marginHorizontal: 20,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recommendationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  actionsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  clearAllButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  clearAllButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NailSizesScreen;