import { useEffect } from 'react';

/**
 * 네이버 OAuth 콜백 페이지
 *
 * 네이버 로그인 후 리다이렉트되는 페이지입니다.
 * URL 해시에서 access_token을 추출하여 sessionStorage에 저장하고 창을 닫습니다.
 */
export function NaverCallbackPage() {
  useEffect(() => {
    // URL 해시에서 토큰 정보 추출
    // 형식: #access_token=xxx&state=xxx&token_type=bearer&expires_in=3600
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      console.error('Naver OAuth 에러:', error, errorDescription);
      // 에러 발생 시 창 닫기
      window.close();
      return;
    }

    if (accessToken) {
      // 토큰을 sessionStorage에 저장 (부모 창에서 읽을 수 있도록)
      sessionStorage.setItem('naver_access_token', accessToken);
      if (state) {
        sessionStorage.setItem('naver_oauth_state_response', state);
      }
      console.log('Naver 로그인 성공, 토큰 저장됨');
    }

    // 팝업 창 닫기
    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">네이버 로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default NaverCallbackPage;