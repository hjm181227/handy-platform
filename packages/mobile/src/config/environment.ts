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

    // iOS의 경우 Info.plist에서 읽을 수 있도록 확장 가능
    // TODO: iOS 환경 변수 설정 추가 시 여기에 구현

  } catch (error) {
    console.warn('🔴 [ENV] Failed to read BuildConfig:', error);
  }

  // Fallback: 기본값은 stage 환경
  console.log('🟡 [ENV] Using fallback environment: stage');
  return 'stage';
};

/**
 * 디버깅용 환경 정보 출력
 */
export const logEnvironmentInfo = (): void => {
  const env = getAppEnvironment();
  console.log(`🌐 [ENV] Current Environment: ${env}`);
  console.log(`🌐 [ENV] Platform: ${Platform.OS}`);
};
