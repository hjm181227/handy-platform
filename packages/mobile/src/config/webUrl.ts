import { Platform } from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';

/**
 * 환경별 WebView URL을 반환하는 중앙 집중화된 함수
 * @returns 환경에 맞는 웹 URL
 */
export const getWebURL = (): string => {
  const env = getCurrentEnvironment();
  
  // 개발/스테이지 환경: stage-handy.com
  if (env === 'development' || env === 'stage') {
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