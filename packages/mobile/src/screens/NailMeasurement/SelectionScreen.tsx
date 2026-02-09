import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NMColors } from '../../styles/nailMeasurementTheme';

type FingerSelection = 'thumb' | 'four_fingers';

interface SelectionScreenProps {
  selectedHand: 'left' | 'right';
  selectedFingerType: FingerSelection;
  onHandSelect: (hand: 'left' | 'right') => void;
  onFingerTypeSelect: (fingerType: FingerSelection) => void;
  onStartCamera: () => void;
  onClose: () => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({
  selectedHand,
  selectedFingerType,
  onHandSelect,
  onFingerTypeSelect,
  onStartCamera,
  onClose,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="x" size={20} color={NMColors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>손톱 사이즈 측정</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 메인 컨텐츠 */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 히어로 섹션 */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {'측정할 손과 손가락을\n선택해주세요'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {'신용카드와 함께 손톱을 촬영하면\nAI가 자동으로 사이즈를 측정해요'}
          </Text>
        </View>

        {/* 손 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>측정할 손</Text>
          <View style={styles.handButtons}>
            <TouchableOpacity
              style={[
                styles.handButton,
                selectedHand === 'left' && styles.handButtonActive,
              ]}
              onPress={() => onHandSelect('left')}
            >
              <View style={[
                styles.handBadge,
                selectedHand === 'left' && styles.handBadgeActive,
              ]}>
                <Text style={[
                  styles.handBadgeText,
                  selectedHand === 'left' && styles.handBadgeTextActive,
                ]}>L</Text>
              </View>
              <Text style={[
                styles.handButtonText,
                selectedHand === 'left' && styles.handButtonTextActive,
              ]}>
                왼손
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.handButton,
                selectedHand === 'right' && styles.handButtonActive,
              ]}
              onPress={() => onHandSelect('right')}
            >
              <View style={[
                styles.handBadge,
                selectedHand === 'right' && styles.handBadgeActive,
              ]}>
                <Text style={[
                  styles.handBadgeText,
                  selectedHand === 'right' && styles.handBadgeTextActive,
                ]}>R</Text>
              </View>
              <Text style={[
                styles.handButtonText,
                selectedHand === 'right' && styles.handButtonTextActive,
              ]}>
                오른손
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 손가락 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>측정할 손가락</Text>
          <View style={styles.fingerTypeButtons}>
            <TouchableOpacity
              style={[
                styles.fingerTypeCard,
                selectedFingerType === 'thumb' && styles.fingerTypeCardActive,
              ]}
              onPress={() => onFingerTypeSelect('thumb')}
            >
              <View style={styles.fingerTypeContent}>
                <View style={[
                  styles.fingerTypeNumber,
                  selectedFingerType === 'thumb' && styles.fingerTypeNumberActive,
                ]}>
                  <Text style={[
                    styles.fingerTypeNumberText,
                    selectedFingerType === 'thumb' && styles.fingerTypeNumberTextActive,
                  ]}>1</Text>
                </View>
                <View style={styles.fingerTypeTextContainer}>
                  <Text style={[
                    styles.fingerTypeTitle,
                    selectedFingerType === 'thumb' && styles.fingerTypeTitleActive,
                  ]}>
                    엄지
                  </Text>
                  <Text style={styles.fingerTypeDesc}>엄지손가락 1개 측정</Text>
                </View>
              </View>
              {selectedFingerType === 'thumb' && (
                <View style={styles.checkMark}>
                  <Icon name="check" size={16} color={NMColors.white} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fingerTypeCard,
                selectedFingerType === 'four_fingers' && styles.fingerTypeCardActive,
              ]}
              onPress={() => onFingerTypeSelect('four_fingers')}
            >
              <View style={styles.fingerTypeContent}>
                <View style={[
                  styles.fingerTypeNumber,
                  selectedFingerType === 'four_fingers' && styles.fingerTypeNumberActive,
                ]}>
                  <Text style={[
                    styles.fingerTypeNumberText,
                    selectedFingerType === 'four_fingers' && styles.fingerTypeNumberTextActive,
                  ]}>4</Text>
                </View>
                <View style={styles.fingerTypeTextContainer}>
                  <Text style={[
                    styles.fingerTypeTitle,
                    selectedFingerType === 'four_fingers' && styles.fingerTypeTitleActive,
                  ]}>
                    나머지 4개 손가락
                  </Text>
                  <Text style={styles.fingerTypeDesc}>검지, 중지, 약지, 새끼 한번에 측정</Text>
                </View>
              </View>
              {selectedFingerType === 'four_fingers' && (
                <View style={styles.checkMark}>
                  <Icon name="check" size={16} color={NMColors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 팁 배너 */}
        <View style={styles.tipBanner}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color={NMColors.tipIcon} />
          <Text style={styles.tipText}>
            손톱이 정면을 향하도록 기울이지 말고 촬영해주세요
          </Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.startButton} onPress={onStartCamera}>
          <Icon name="camera" size={20} color={NMColors.white} />
          <Text style={styles.startButtonText}>촬영하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NMColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 20,
  },
  closeButton: {
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    gap: 32,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: NMColors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 15,
    color: NMColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NMColors.textMuted,
    marginLeft: 4,
  },
  handButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  handButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 16,
    backgroundColor: NMColors.white,
    borderWidth: 1,
    borderColor: NMColors.border,
    gap: 10,
  },
  handButtonActive: {
    borderWidth: 2,
    borderColor: NMColors.purple,
    shadowColor: NMColors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  handBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handBadgeActive: {
    backgroundColor: NMColors.purpleLight,
  },
  handBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: NMColors.textSecondary,
  },
  handBadgeTextActive: {
    color: NMColors.purple,
  },
  handButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: NMColors.textSecondary,
  },
  handButtonTextActive: {
    color: NMColors.purple,
    fontWeight: '600',
  },
  fingerTypeButtons: {
    gap: 12,
  },
  fingerTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: NMColors.white,
    borderWidth: 1,
    borderColor: NMColors.border,
  },
  fingerTypeCardActive: {
    borderWidth: 2,
    borderColor: NMColors.purple,
    shadowColor: NMColors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  fingerTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fingerTypeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fingerTypeNumberActive: {
    backgroundColor: NMColors.purpleLight,
  },
  fingerTypeNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: NMColors.textSecondary,
  },
  fingerTypeNumberTextActive: {
    color: NMColors.purple,
  },
  fingerTypeTextContainer: {
    flex: 1,
  },
  fingerTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: NMColors.text,
    marginBottom: 2,
  },
  fingerTypeTitleActive: {
    color: NMColors.purple,
  },
  fingerTypeDesc: {
    fontSize: 13,
    color: NMColors.textSecondary,
  },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NMColors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NMColors.tipBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: NMColors.tipText,
    lineHeight: 18,
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  startButton: {
    backgroundColor: NMColors.purple,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: NMColors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SelectionScreen;
