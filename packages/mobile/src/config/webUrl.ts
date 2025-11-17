import { Platform } from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';

/**
 * 환경별 WebView URL을 반환하는 중앙 집중화된 함수
 * @returns 환경에 맞는 웹 URL
 */
export const getWebURL = (): string => {
  const env = getCurrentEnvironment();

  // 개발 환경: 로컬 개발 서버 사용
  if (env === 'development') {
    // 실물 디바이스용 - PC 네트워크 IP 사용
    return 'http://192.168.45.86:3001';

    // Android 에뮬레이터용 (필요시 아래 주석 해제하고 위 라인 주석 처리)
    // const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    // return `http://${host}:3001`;
  }

  // 스테이지 환경: stage-handy.com
  if (env === 'stage') {
    return 'https://stage-handy.com';
  }

  // 프로덕션 환경: h-andy.com
  return 'https://h-andy.com';
};

/**
 * 디버깅용 환경 정보를 콘솔에 출력
 */
export const logWebUrlInfo = (): void => {
  const env = getCurrentEnvironment();
  const url = getWebURL();
  console.log(`🌐 [WebURL] Environment: ${env}, URL: ${url}`);
};
