import { NativeModules, Platform } from 'react-native';

/**
 * React Native에서 네이티브 빌드 환경 변수를 읽어오는 함수
 * Android BuildConfig에서 APP_ENV 값을 가져옵니다.
 *
 * @returns 'stage' | 'production' | 'development'
 */
export const getAppEnvironment = (): string => {
  try {
    if (Platform.OS === 'android') {
      // Android BuildConfig에서 환경 읽기
      const BuildConfig = NativeModules.BuildConfig;
      if (BuildConfig && BuildConfig.APP_ENV) {
        console.log('🟢 [ENV] BuildConfig.APP_ENV:', BuildConfig.APP_ENV);
        return BuildConfig.APP_ENV;
      }
    }

    // iOS: process.env.REACT_NATIVE_ENV 우선, 없으면 __DEV__ 플래그로 감지
    if (Platform.OS === 'ios') {
      if (typeof process !== 'undefined' && process.env?.REACT_NATIVE_ENV) {
        console.log('🟢 [ENV] iOS process.env.REACT_NATIVE_ENV:', process.env.REACT_NATIVE_ENV);
        return process.env.REACT_NATIVE_ENV;
      }
      if (__DEV__) {
        console.log('🟢 [ENV] iOS __DEV__ mode: development');
        return 'development';
      }
      // iOS release 빌드는 production으로 fallback (App Store 배포용)
    }

  } catch (error) {
    console.warn('🔴 [ENV] Failed to read BuildConfig:', error);
  }

  // Fallback: 기본값은 production 환경 (App Store release)
  console.log('🟡 [ENV] Using fallback environment: production');
  return 'production';
};

/**
 * 디버깅용 환경 정보 출력
 */
export const logEnvironmentInfo = (): void => {
  const env = getAppEnvironment();
  console.log(`🌐 [ENV] Current Environment: ${env}`);
  console.log(`🌐 [ENV] Platform: ${Platform.OS}`);
};
