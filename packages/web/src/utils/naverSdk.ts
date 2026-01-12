// Naver Login SDK 초기화 및 관리 유틸리티

// Naver Login SDK 전역 타입 정의
declare global {
  interface Window {
    naver: {
      LoginWithNaverId: new (config: NaverLoginConfig) => NaverLoginInstance;
    };
  }
}

interface NaverLoginConfig {
  clientId: string;
  callbackUrl: string;
  isPopup: boolean;
  loginButton: {
    color: string;
    type: number;
    height: number;
  };
  callbackHandle: boolean;
}

interface NaverLoginInstance {
  init: () => void;
  logout: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  user: {
    getEmail: () => string;
    getName: () => string;
    getId: () => string;
    getProfileImage: () => string;
    getNickName: () => string;
  };
}

// Naver Client ID (환경 변수에서 가져옴)
const NAVER_CLIENT_ID = (import.meta as any).env.VITE_NAVER_CLIENT_ID || '';

// 디버깅용: Client ID가 제대로 로드되었는지 확인
console.log('Naver Client ID 로드됨:', NAVER_CLIENT_ID ? '✅ 설정됨' : '❌ 설정되지 않음');

let isNaverScriptLoaded = false;

/**
 * 현재 환경에 맞는 콜백 URL 반환
 */
const getCallbackUrl = (): string => {
  const env = (import.meta as any).env.VITE_ENVIRONMENT || 'development';

  if (env === 'production') {
    return 'https://h-andy.com/auth/naver/callback';
  } else if (env === 'staging') {
    return 'https://stage-handy.com/auth/naver/callback';
  } else {
    // 로컬 개발 환경
    return `${window.location.origin}/auth/naver/callback`;
  }
};

/**
 * Naver Login SDK 스크립트를 동적으로 로드합니다
 */
const loadNaverScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.naver?.LoginWithNaverId) {
      console.log('Naver SDK는 이미 로드되어 있습니다.');
      isNaverScriptLoaded = true;
      resolve();
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src*="naveridlogin_js_sdk"]');
    if (existingScript) {
      // 스크립트가 있지만 아직 로드되지 않은 경우 대기
      let attempts = 0;
      const maxAttempts = 50;

      const checkLoaded = () => {
        attempts++;
        if (window.naver?.LoginWithNaverId) {
          isNaverScriptLoaded = true;
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error('Naver SDK 로딩 시간 초과'));
          return;
        }
        setTimeout(checkLoaded, 100);
      };

      checkLoaded();
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Naver SDK 스크립트 로드 완료');
      // 로드 후 초기화 대기
      let attempts = 0;
      const maxAttempts = 50;

      const checkReady = () => {
        attempts++;
        if (window.naver?.LoginWithNaverId) {
          isNaverScriptLoaded = true;
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error('Naver SDK 초기화 시간 초과'));
          return;
        }
        setTimeout(checkReady, 100);
      };

      checkReady();
    };

    script.onerror = () => {
      reject(new Error('Naver SDK 스크립트 로드 실패'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Naver SDK를 초기화합니다
 */
export const initNaverSdk = async (): Promise<void> => {
  try {
    if (!NAVER_CLIENT_ID) {
      throw new Error('Naver Client ID가 설정되지 않았습니다.');
    }

    await loadNaverScript();
    console.log('Naver SDK 준비 완료');
  } catch (error) {
    console.error('Naver SDK 초기화 실패:', error);
    throw error;
  }
};

/**
 * Naver 로그인을 실행합니다 (팝업 방식)
 */
export const executeNaverLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.naver?.LoginWithNaverId) {
      reject(new Error('Naver SDK가 초기화되지 않았습니다.'));
      return;
    }

    if (!NAVER_CLIENT_ID) {
      reject(new Error('Naver Client ID가 설정되지 않았습니다.'));
      return;
    }

    try {
      const callbackUrl = getCallbackUrl();

      // 고유한 state 값 생성 (CSRF 방지)
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('naver_oauth_state', state);

      // 네이버 로그인 URL 직접 구성 (팝업 방식)
      const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
      naverAuthUrl.searchParams.set('response_type', 'token');
      naverAuthUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
      naverAuthUrl.searchParams.set('redirect_uri', callbackUrl);
      naverAuthUrl.searchParams.set('state', state);

      // 팝업 창 열기
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        naverAuthUrl.toString(),
        'naverLogin',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!popup) {
        reject(new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'));
        return;
      }

      // 팝업에서 토큰을 받을 때까지 대기
      const checkPopup = setInterval(() => {
        try {
          // 팝업이 닫혔는지 확인
          if (popup.closed) {
            clearInterval(checkPopup);

            // sessionStorage에서 토큰 확인 (콜백 페이지에서 저장함)
            const accessToken = sessionStorage.getItem('naver_access_token');
            const storedState = sessionStorage.getItem('naver_oauth_state_response');

            // 토큰 정보 삭제
            sessionStorage.removeItem('naver_access_token');
            sessionStorage.removeItem('naver_oauth_state');
            sessionStorage.removeItem('naver_oauth_state_response');

            if (accessToken) {
              // state 검증
              if (storedState && storedState !== state) {
                reject(new Error('보안 검증 실패 (state mismatch)'));
                return;
              }
              resolve(accessToken);
            } else {
              reject({ cancelled: true });
            }
            return;
          }
        } catch {
          // 크로스 도메인 에러 무시 (다른 도메인에 있을 때)
        }
      }, 500);

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        clearInterval(checkPopup);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('로그인 시간이 초과되었습니다.'));
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Naver 로그인 실행 중 오류:', error);
      reject(new Error('Naver 로그인 실행에 실패했습니다.'));
    }
  });
};

/**
 * Naver SDK가 초기화되었는지 확인합니다
 */
export const isNaverSdkReady = (): boolean => {
  return isNaverScriptLoaded && !!window.naver?.LoginWithNaverId;
};