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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>네일 사이즈 측정</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 메인 컨텐츠 */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 안내 텍스트 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>AI 자동 측정</Text>
          <Text style={styles.guideText}>
            신용카드와 함께 손톱을 촬영하면{'\n'}
            AI가 자동으로 사이즈를 측정해드려요
          </Text>
        </View>

        {/* 손 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>측정할 손</Text>
          <View style={styles.handButtons}>
            <TouchableOpacity
              style={[
                styles.handButton,
                selectedHand === 'left' && styles.handButtonActive,
              ]}
              onPress={() => onHandSelect('left')}
            >
              <Text style={styles.handLabel}>L</Text>
              <Text
                style={[
                  styles.handButtonText,
                  selectedHand === 'left' && styles.handButtonTextActive,
                ]}
              >
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
              <Text style={styles.handLabel}>R</Text>
              <Text
                style={[
                  styles.handButtonText,
                  selectedHand === 'right' && styles.handButtonTextActive,
                ]}
              >
                오른손
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 손가락 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>측정할 손가락</Text>
          <View style={styles.fingerTypeButtons}>
            <TouchableOpacity
              style={[
                styles.fingerTypeButton,
                selectedFingerType === 'thumb' && styles.fingerTypeButtonActive,
              ]}
              onPress={() => onFingerTypeSelect('thumb')}
            >
              <View style={styles.fingerTypeContent}>
                <Text style={styles.fingerTypeLabel}>1</Text>
                <View style={styles.fingerTypeTextContainer}>
                  <Text
                    style={[
                      styles.fingerTypeTitle,
                      selectedFingerType === 'thumb' && styles.fingerTypeTextActive,
                    ]}
                  >
                    엄지
                  </Text>
                  <Text style={styles.fingerTypeDesc}>엄지손가락 1개 측정</Text>
                </View>
              </View>
              {selectedFingerType === 'thumb' && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fingerTypeButton,
                selectedFingerType === 'four_fingers' && styles.fingerTypeButtonActive,
              ]}
              onPress={() => onFingerTypeSelect('four_fingers')}
            >
              <View style={styles.fingerTypeContent}>
                <Text style={styles.fingerTypeLabel}>4</Text>
                <View style={styles.fingerTypeTextContainer}>
                  <Text
                    style={[
                      styles.fingerTypeTitle,
                      selectedFingerType === 'four_fingers' && styles.fingerTypeTextActive,
                    ]}
                  >
                    나머지 4개 손가락
                  </Text>
                  <Text style={styles.fingerTypeDesc}>검지, 중지, 약지, 새끼 한번에 측정</Text>
                </View>
              </View>
              {selectedFingerType === 'four_fingers' && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.startButton} onPress={onStartCamera}>
          <Text style={styles.startButtonText}>촬영하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 28,
    fontWeight: '300',
  },
  title: {
    color: '#212529',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  guideSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
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
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  handButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  handLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#495057',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9ECEF',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  handButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  handButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  fingerTypeButtons: {
    gap: 12,
  },
  fingerTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  fingerTypeButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  fingerTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fingerTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#495057',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9ECEF',
    textAlign: 'center',
    lineHeight: 36,
    marginRight: 16,
    overflow: 'hidden',
  },
  fingerTypeTextContainer: {
    flex: 1,
  },
  fingerTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  fingerTypeTextActive: {
    color: '#007AFF',
  },
  fingerTypeDesc: {
    fontSize: 13,
    color: '#6C757D',
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomButton: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SelectionScreen;
