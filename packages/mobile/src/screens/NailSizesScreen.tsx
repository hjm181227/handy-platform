import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { userService } from '../services/apiService';
import { englishToKoreanFinger, ALL_FINGERS_ENGLISH } from '@handy-platform/shared/src/utils/fingerMapping';
import type { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import { NMColors } from '../styles/nailMeasurementTheme';

interface NailSizesScreenProps {
  onClose?: () => void;
  onNavigateToCamera?: (hand?: 'left' | 'right', finger?: string) => void;
  onMeasurementUpdate?: () => void;
  refreshKey?: number;
}

const NailSizesScreen: React.FC<NailSizesScreenProps> = ({
  onClose,
  onNavigateToCamera,
  onMeasurementUpdate,
  refreshKey,
}) => {
  const [nailSizeData, setNailSizeData] = useState<NailSizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNailSizeData();
  }, [refreshKey]);

  const loadNailSizeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 디버그: 토큰 상태 확인
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('@handy_platform:accessToken');
      console.log('🔍 [NailSizes] Token check:', token ? `${token.substring(0, 20)}...` : 'NULL');
      console.log('🔍 [NailSizes] userService:', typeof userService, !!userService);

      let response;
      try {
        response = await userService.getNailSize();
      } catch (callErr: any) {
        throw callErr;
      }

      if (response.success) {
        setNailSizeData(response.data || null);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderFingerGrid = (hand: 'left' | 'right', accentColor: string) => {
    if (!nailSizeData) return null;
    const data = hand === 'left' ? nailSizeData.leftHand : nailSizeData.rightHand;

    return (
      <View style={styles.fingerGrid}>
        {ALL_FINGERS_ENGLISH.map((finger) => {
          const size = data[finger];
          const isMeasured = size > 0;
          const fingerKorean = englishToKoreanFinger(finger);

          return (
            <View key={`${hand}-${finger}`} style={styles.fingerCell}>
              <Text style={styles.fingerCellName}>{fingerKorean}</Text>
              {isMeasured ? (
                <Text style={[styles.fingerCellValue, { color: accentColor }]}>
                  {size.toFixed(1)}
                </Text>
              ) : (
                <Text style={styles.fingerCellEmpty}>-</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={NMColors.purple} />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNailSizeData}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onClose?.()}
        >
          <Icon name="arrow-left" size={20} color={NMColors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>손톱 사이즈</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadNailSizeData}>
          <Text style={styles.refreshButtonText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 측정 일시 */}
        {nailSizeData && (
          <View style={styles.dateRow}>
            <Icon name="calendar" size={16} color={NMColors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(nailSizeData.measuredAt)} 측정
            </Text>
          </View>
        )}

        {/* 데이터가 없을 때 */}
        {!nailSizeData && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyDash}>--</Text>
            <Text style={styles.emptyText}>아직 측정된 손톱 사이즈가 없습니다</Text>
            <TouchableOpacity
              style={styles.emptyMeasureButton}
              onPress={() => onNavigateToCamera?.()}
            >
              <Text style={styles.emptyMeasureButtonText}>측정 시작하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 왼손 */}
        {nailSizeData && (
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <View style={[styles.handBadge, { backgroundColor: NMColors.purple }]}>
                <Text style={styles.handBadgeText}>L</Text>
              </View>
              <Text style={styles.handTitle}>왼손</Text>
            </View>
            {renderFingerGrid('left', NMColors.purple)}
          </View>
        )}

        {/* 오른손 */}
        {nailSizeData && (
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <View style={[styles.handBadge, { backgroundColor: NMColors.pink }]}>
                <Text style={styles.handBadgeText}>R</Text>
              </View>
              <Text style={styles.handTitle}>오른손</Text>
            </View>
            {renderFingerGrid('right', NMColors.pink)}
          </View>
        )}

        {/* AR 측정 카드 */}
        <TouchableOpacity
          style={styles.arCard}
          onPress={() => onNavigateToCamera?.()}
        >
          <View style={styles.arCardContent}>
            <View style={styles.arCardIcon}>
              <Icon name="maximize" size={20} color={NMColors.white} />
            </View>
            <View style={styles.arCardTexts}>
              <Text style={styles.arCardTitle}>다시 측정하기</Text>
              <Text style={styles.arCardSubtitle}>카메라로 정확한 측정</Text>
            </View>
            <Icon name="chevron-right" size={20} color={NMColors.purple} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NMColors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: NMColors.textSecondary,
    fontSize: 16,
    marginTop: 15,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: NMColors.buttonBg,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  retryButtonText: {
    color: NMColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NMColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: NMColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: NMColors.purple,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 20,
  },
  // Date row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: NMColors.textSecondary,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyDash: {
    fontSize: 40,
    fontWeight: '300',
    color: NMColors.textTertiary,
    marginBottom: 20,
  },
  emptyText: {
    color: NMColors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyMeasureButton: {
    backgroundColor: NMColors.buttonBg,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  emptyMeasureButtonText: {
    color: NMColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Hand section
  handSection: {
    gap: 12,
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  handBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: NMColors.white,
  },
  handTitle: {
    color: NMColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  // 5-column grid
  fingerGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  fingerCell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NMColors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  fingerCellName: {
    fontSize: 12,
    color: NMColors.textSecondary,
  },
  fingerCellValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  fingerCellEmpty: {
    fontSize: 18,
    fontWeight: '500',
    color: NMColors.textTertiary,
  },
  // AR Card
  arCard: {
    backgroundColor: NMColors.ctaBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: NMColors.ctaBorder,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  arCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NMColors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  arCardTexts: {
    flex: 1,
  },
  arCardTitle: {
    color: NMColors.ctaText,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  arCardSubtitle: {
    color: NMColors.ctaSubtext,
    fontSize: 14,
  },
});

export default NailSizesScreen;
