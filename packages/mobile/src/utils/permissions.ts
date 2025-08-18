import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
      if (!permission) return false;
      
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: '카메라 권한 요청',
          message: '상품 사진을 촬영하기 위해 카메라 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    try {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      if (!permission) return false;
      
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: '저장소 권한 요청',
          message: '이미지를 불러오기 위해 저장소 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    try {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

export const showPermissionAlert = (type: 'camera' | 'storage') => {
  const message = type === 'camera' 
    ? '카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
    : '저장소 권한이 필요합니다. 설정에서 권한을 허용해주세요.';
    
  Alert.alert('권한 필요', message, [
    { text: '취소', style: 'cancel' },
    { text: '설정으로 이동', onPress: () => {
      Linking.openSettings();
    }},
  ]);
};

// 새로운 권한을 자동으로 추가하는 유틸리티 함수들
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: '위치 권한 요청',
          message: '배송지 설정을 위해 위치 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    try {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Android 13+ 알림 권한
    try {
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!permission) return true; // 이전 버전에서는 권한 불필요
      
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: '알림 권한 요청',
          message: '주문 상태 알림을 받기 위해 알림 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    try {
      const result = await request(PERMISSIONS.IOS.NOTIFICATIONS);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: '마이크 권한 요청',
          message: '음성 검색 기능을 위해 마이크 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    try {
      const result = await request(PERMISSIONS.IOS.MICROPHONE);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

// 권한 상태 확인 함수
export const checkPermissionStatus = async (type: 'camera' | 'storage' | 'location' | 'notification' | 'microphone'): Promise<boolean> => {
  if (Platform.OS === 'android') {
    let permission;
    switch (type) {
      case 'camera':
        permission = PermissionsAndroid.PERMISSIONS.CAMERA;
        break;
      case 'storage':
        permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        break;
      case 'location':
        permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        break;
      case 'notification':
        permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        break;
      case 'microphone':
        permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
        break;
      default:
        return false;
    }
    
    if (!permission) return type === 'notification'; // 이전 Android 버전
    
    try {
      const result = await PermissionsAndroid.check(permission);
      return result;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    let permission;
    switch (type) {
      case 'camera':
        permission = PERMISSIONS.IOS.CAMERA;
        break;
      case 'storage':
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
        break;
      case 'location':
        permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        break;
      case 'notification':
        permission = PERMISSIONS.IOS.NOTIFICATIONS;
        break;
      case 'microphone':
        permission = PERMISSIONS.IOS.MICROPHONE;
        break;
      default:
        return false;
    }
    
    try {
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};