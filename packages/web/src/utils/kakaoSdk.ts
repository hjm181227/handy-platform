// 카카오 SDK 초기화 및 관리 유틸리티

// 카카오 SDK 및 Daum Postcode 전역 타입 정의
declare global {
  interface Window {
    Kakao: any;
    daum: any;
  }
}

// 카카오 앱 키 - 이 파일이 유일한 출처다.
// index.html이나 main.tsx에서 하드코딩 init을 하면 안 된다.
// (한 번 초기화되면 isInitialized() 가드에 걸려 올바른 키로 재초기화가 불가능해진다.)
const KAKAO_APP_KEY: string | undefined = (import.meta as any).env.VITE_KAKAO_APP_KEY;

/**
 * 카카오 SDK가 HTML에서 로드될 때까지 대기합니다
 */
const waitForKakaoSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.Kakao && window.Kakao.Auth) {
      console.log('카카오 SDK는 이미 로드되어 있습니다.');
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 0.1초씩 50번 = 5초
    
    const checkSdk = () => {
      attempts++;
      
      if (window.Kakao && window.Kakao.Auth && typeof window.Kakao.Auth.login === 'function') {
        console.log('카카오 SDK 로드 완료 확인');
        resolve();
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error('카카오 SDK 로딩 상태:', {
          Kakao: !!window.Kakao,
          Auth: !!(window.Kakao && window.Kakao.Auth),
          login: !!(window.Kakao && window.Kakao.Auth && window.Kakao.Auth.login)
        });
        reject(new Error('카카오 SDK 로딩 시간 초과 (5초)'));
        return;
      }
      
      console.log(`카카오 SDK 로딩 대기 중... (${attempts}/${maxAttempts})`);
      setTimeout(checkSdk, 100);
    };
    
    checkSdk();
  });
};

/**
 * 카카오 SDK를 초기화합니다
 */
export const initKakaoSdk = async (): Promise<void> => {
  try {
    if (!KAKAO_APP_KEY) {
      // 조용히 잘못된 키로 초기화되어 로그인만 실패하는 것보다,
      // 설정 누락을 즉시 드러내는 편이 낫다.
      throw new Error(
        'VITE_KAKAO_APP_KEY가 설정되지 않았습니다. 배포 환경변수를 확인하세요.'
      );
    }

    // HTML에서 로드된 SDK를 기다림
    await waitForKakaoSdk();

    if (!window.Kakao) {
      throw new Error('카카오 SDK가 로드되지 않았습니다.');
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
    }
  } catch (error) {
    console.error('카카오 SDK 초기화 실패:', error);
    throw error;
  }
};

/**
 * 카카오 로그인을 실행합니다
 */
export const executeKakaoLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    if (!window.Kakao.Auth || typeof window.Kakao.Auth.login !== 'function') {
      reject(new Error('카카오 Auth 모듈을 사용할 수 없습니다.'));
      return;
    }

    try {
      window.Kakao.Auth.login({
        success: (authObj: any) => {
          console.log('카카오 로그인 성공:', authObj);
          if (authObj && authObj.access_token) {
            resolve(authObj.access_token);
          } else {
            reject(new Error('액세스 토큰을 받지 못했습니다.'));
          }
        },
        fail: (error: any) => {
          console.error('카카오 로그인 실패:', error);
          reject(new Error('카카오 로그인이 취소되었거나 실패했습니다.'));
        }
      });
    } catch (error) {
      console.error('카카오 로그인 실행 중 오류:', error);
      reject(new Error('카카오 로그인 실행에 실패했습니다.'));
    }
  });
};

/**
 * 카카오 로그아웃을 실행합니다
 */
export const executeKakaoLogout = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.Kakao) {
      resolve();
      return;
    }

    window.Kakao.Auth.logout(() => {
      console.log('카카오 로그아웃 완료');
      resolve();
    });
  });
};

/**
 * 카카오 사용자 정보를 가져옵니다
 */
export const getKakaoUserInfo = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.API.request({
      url: '/v2/user/me',
      success: (response: any) => {
        console.log('카카오 사용자 정보:', response);
        resolve(response);
      },
      fail: (error: any) => {
        console.error('카카오 사용자 정보 조회 실패:', error);
        reject(new Error('사용자 정보를 가져올 수 없습니다.'));
      }
    });
  });
};