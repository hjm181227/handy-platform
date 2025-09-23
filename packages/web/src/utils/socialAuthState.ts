// 소셜 로그인 임시 상태 관리

export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  provider: 'kakao' | 'google' | 'naver' | 'apple';
}

export interface SocialAuthState {
  accessToken: string;
  userInfo: SocialUserInfo;
  timestamp: number;
}

const SOCIAL_AUTH_KEY = 'social_auth_temp';
const EXPIRE_TIME = 10 * 60 * 1000; // 10분

/**
 * 소셜 로그인 임시 상태 저장
 */
export const setSocialAuthState = (state: SocialAuthState): void => {
  const stateWithTimestamp = {
    ...state,
    timestamp: Date.now()
  };
  const serializedState = JSON.stringify(stateWithTimestamp);
  sessionStorage.setItem(SOCIAL_AUTH_KEY, serializedState);
};

/**
 * 소셜 로그인 임시 상태 조회
 */
export const getSocialAuthState = (): SocialAuthState | null => {
  try {
    const stored = sessionStorage.getItem(SOCIAL_AUTH_KEY);

    if (!stored) {
      return null;
    }

    const state: SocialAuthState = JSON.parse(stored);

    // 만료 시간 확인
    const currentTime = Date.now();
    const elapsed = currentTime - state.timestamp;

    if (elapsed > EXPIRE_TIME) {
      clearSocialAuthState();
      return null;
    }

    return state;
  } catch (error) {
    clearSocialAuthState();
    return null;
  }
};

/**
 * 소셜 로그인 임시 상태 삭제
 */
export const clearSocialAuthState = (): void => {
  try {
    sessionStorage.removeItem(SOCIAL_AUTH_KEY);
    console.log('소셜 로그인 임시 상태 삭제됨');
  } catch (error) {
    console.error('소셜 로그인 상태 삭제 실패:', error);
  }
};

/**
 * 카카오 사용자 정보를 표준 형식으로 변환
 */
export const normalizeKakaoUser = (kakaoUser: any): SocialUserInfo => ({
  id: kakaoUser.id.toString(),
  email: kakaoUser.kakao_account?.email || '',
  name: kakaoUser.kakao_account?.profile?.nickname || kakaoUser.properties?.nickname || '',
  profileImage: kakaoUser.kakao_account?.profile?.profile_image_url || kakaoUser.properties?.profile_image,
  provider: 'kakao'
});

/**
 * 소셜 로그인 URL 생성 (각 소셜별)
 */
export const getSocialSignupUrl = (provider: string): string => {
  return `/auth/social/signup?provider=${provider}`;
};
