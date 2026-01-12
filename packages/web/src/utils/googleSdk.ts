// Google Sign-In SDK 초기화 및 관리 유틸리티

// Google Identity Services 전역 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback?: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
          initCodeClient: (config: any) => any;
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean;
        };
      };
    };
  }
}

// Google Client ID (환경 변수에서 가져옴)
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';

let isGoogleScriptLoaded = false;
let tokenClient: any = null;

/**
 * Google Identity Services 스크립트를 동적으로 로드합니다
 */
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.google?.accounts?.oauth2) {
      console.log('Google SDK는 이미 로드되어 있습니다.');
      isGoogleScriptLoaded = true;
      resolve();
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      // 스크립트가 있지만 아직 로드되지 않은 경우 대기
      let attempts = 0;
      const maxAttempts = 50;

      const checkLoaded = () => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          isGoogleScriptLoaded = true;
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error('Google SDK 로딩 시간 초과'));
          return;
        }
        setTimeout(checkLoaded, 100);
      };

      checkLoaded();
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google SDK 스크립트 로드 완료');
      // 로드 후 초기화 대기
      let attempts = 0;
      const maxAttempts = 50;

      const checkReady = () => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          isGoogleScriptLoaded = true;
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error('Google SDK 초기화 시간 초과'));
          return;
        }
        setTimeout(checkReady, 100);
      };

      checkReady();
    };

    script.onerror = () => {
      reject(new Error('Google SDK 스크립트 로드 실패'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Google SDK를 초기화합니다
 */
export const initGoogleSdk = async (): Promise<void> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID가 설정되지 않았습니다.');
    }

    await loadGoogleScript();
    console.log('Google SDK 준비 완료');
  } catch (error) {
    console.error('Google SDK 초기화 실패:', error);
    throw error;
  }
};

/**
 * Google 로그인을 실행합니다 (팝업 방식으로 Access Token 획득)
 */
export const executeGoogleLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google SDK가 초기화되지 않았습니다.'));
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID가 설정되지 않았습니다.'));
      return;
    }

    let isResolved = false;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let visibilityHandler: (() => void) | null = null;

    const cleanup = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
      }
    };

    const handleCancel = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject({ cancelled: true });
      }
    };

    // visibility change 감지 (탭 전환 후 복귀)
    let wasHidden = false;
    visibilityHandler = () => {
      if (document.hidden) {
        wasHidden = true;
      } else if (wasHidden && !isResolved) {
        setTimeout(() => {
          if (!isResolved) {
            handleCancel();
          }
        }, 1000);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // 주기적으로 포커스 체크 (fallback)
    let focusLostAt: number | null = null;
    checkInterval = setInterval(() => {
      if (isResolved) {
        cleanup();
        return;
      }

      if (!document.hasFocus()) {
        if (!focusLostAt) focusLostAt = Date.now();
      } else {
        if (focusLostAt && Date.now() - focusLostAt > 300) {
          handleCancel();
        }
        focusLostAt = null;
      }
    }, 200);

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response: any) => {
          if (isResolved) return;

          if (response.error) {
            isResolved = true;
            cleanup();
            if (response.error === 'popup_closed_by_user') {
              reject({ cancelled: true });
            } else {
              reject(new Error(response.error_description || 'Google 로그인에 실패했습니다.'));
            }
            return;
          }

          if (response.access_token) {
            isResolved = true;
            cleanup();
            resolve(response.access_token);
          } else {
            isResolved = true;
            cleanup();
            reject(new Error('Access Token을 받지 못했습니다.'));
          }
        },
        error_callback: (error: any) => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          if (error.type === 'popup_closed') {
            reject({ cancelled: true });
          } else {
            reject(new Error('Google 로그인 중 오류가 발생했습니다.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      isResolved = true;
      cleanup();
      reject(new Error('Google 로그인 실행에 실패했습니다.'));
    }
  });
};

/**
 * Google 로그아웃 (토큰 무효화)
 */
export const executeGoogleLogout = (accessToken?: string): Promise<void> => {
  return new Promise((resolve) => {
    if (accessToken && window.google?.accounts?.oauth2) {
      // 토큰 revoke
      window.google.accounts.id.revoke(accessToken, () => {
        console.log('Google 토큰 무효화 완료');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Google SDK가 초기화되었는지 확인합니다
 */
export const isGoogleSdkReady = (): boolean => {
  return isGoogleScriptLoaded && !!window.google?.accounts?.oauth2;
};