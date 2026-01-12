// Naver Login - Backend-driven Authorization Code Flow
// 백엔드 주도 방식으로 네이버 로그인 처리

/**
 * 네이버 로그인 실행 (백엔드 리다이렉트 방식)
 * 백엔드의 /api/oauth/naver/login 엔드포인트로 리다이렉트합니다.
 * 백엔드가 전체 OAuth 흐름을 처리하고, 완료 후 프론트엔드로 토큰과 함께 리다이렉트합니다.
 */
export const executeNaverLogin = (): void => {
  const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:11000';
  const naverLoginUrl = `${apiBaseUrl}/api/oauth/naver/login`;

  console.log('Naver 로그인: 백엔드로 리다이렉트', naverLoginUrl);

  // 백엔드 OAuth 엔드포인트로 리다이렉트
  window.location.href = naverLoginUrl;
};

/**
 * Naver SDK 초기화 (백엔드 주도 방식에서는 필요 없음)
 * 하위 호환성을 위해 빈 Promise 반환
 */
export const initNaverSdk = async (): Promise<void> => {
  // 백엔드 주도 방식에서는 프론트엔드 SDK 초기화가 필요 없음
  console.log('Naver SDK: 백엔드 주도 방식 사용 (프론트엔드 SDK 초기화 생략)');
  return Promise.resolve();
};

/**
 * Naver SDK 준비 상태 확인 (항상 true 반환)
 */
export const isNaverSdkReady = (): boolean => {
  return true;
};
