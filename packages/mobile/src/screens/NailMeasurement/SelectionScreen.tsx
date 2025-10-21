import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface SelectionScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  onHandSelect: (hand: 'left' | 'right') => void;
  onFingerSelect: (finger: string) => void;
  onStartCamera: () => void;
  onClose: () => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({
  selectedHand,
  selectedFinger,
  onHandSelect,
  onFingerSelect,
  onStartCamera,
  onClose,
}) => {
  const fingers = ['엄지', '검지', '중지', '약지', '새끼'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>네일 사이즈 측정</Text>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        {/* 손 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>측정할 손을 선택하세요</Text>
          <View style={styles.handButtons}>
            <TouchableOpacity
              style={[
                styles.handButton,
                selectedHand === 'left' && styles.handButtonActive,
              ]}
              onPress={() => onHandSelect('left')}
            >
              <Text
                style={[
                  styles.handButtonText,
                  selectedHand === 'left' && styles.handButtonTextActive,
                ]}
              >
                🤚 왼손
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.handButton,
                selectedHand === 'right' && styles.handButtonActive,
              ]}
              onPress={() => onHandSelect('right')}
            >
              <Text
                style={[
                  styles.handButtonText,
                  selectedHand === 'right' && styles.handButtonTextActive,
                ]}
              >
                ✋ 오른손
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 손가락 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>측정할 손가락을 선택하세요</Text>
          <View style={styles.fingerButtons}>
            {fingers.map((finger) => (
              <TouchableOpacity
                key={finger}
                style={[
                  styles.fingerButton,
                  selectedFinger === finger && styles.fingerButtonActive,
                ]}
                onPress={() => onFingerSelect(finger)}
              >
                <Text
                  style={[
                    styles.fingerButtonText,
                    selectedFinger === finger && styles.fingerButtonTextActive,
                  ]}
                >
                  {finger}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.startButton} onPress={onStartCamera}>
          <Text style={styles.startButtonText}>📷 촬영 시작</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  section: {
    marginBottom: 50,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  handButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  handButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 120,
  },
  handButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  handButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  handButtonTextActive: {
    fontWeight: 'bold',
  },
  fingerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  fingerButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 80,
  },
  fingerButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  fingerButtonText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  fingerButtonTextActive: {
    fontWeight: 'bold',
  },
  bottomButton: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SelectionScreen;