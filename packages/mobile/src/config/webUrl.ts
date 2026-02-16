import { Platform } from 'react-native';
import { getAppEnvironment } from './environment';

/**
 * 환경별 WebView URL을 반환하는 중앙 집중화된 함수
 * @returns 환경에 맞는 웹 URL
 */
export const getWebURL = (): string => {
  const env = getAppEnvironment();

  // 개발 환경: 로컬 개발 서버 사용
  if (env === 'development') {
    // 실물 디바이스용 - PC 네트워크 IP 사용 (웹 서버: 포트 3001)
    // return 'http://172.30.1.71:3001';

    // Android 에뮬레이터용
    // const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    // return `http://${host}:3001`;

    // 에뮬레이터 테스트: Preview 배포 사용
    return 'https://handy-web-production-lev8t6vpp-heobusys-projects.vercel.app';
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
  const env = getAppEnvironment();
  const url = getWebURL();
  console.log(`🌐 [WebURL] Environment: ${env}, URL: ${url}`);
};
