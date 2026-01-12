import { useEffect, useState } from 'react';
import { webApiService } from '../../services/apiService';
import { SocialTermsStep } from '../auth/SocialTermsStep';
import { SocialNewUserInfo } from '../../contexts/AuthModalContext';

interface NaverCallbackPageProps {
  onGo?: (path: string) => void;
}

/**
 * 네이버 OAuth 콜백 페이지 (백엔드 주도 방식)
 *
 * 백엔드에서 OAuth 처리 후 리다이렉트되는 페이지입니다.
 * URL 쿼리 파라미터에서 JWT 토큰을 추출하여 저장하고 로그인을 완료합니다.
 */
export function NaverCallbackPage({ onGo }: NaverCallbackPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'terms'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newUserInfo, setNewUserInfo] = useState<SocialNewUserInfo | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URL 쿼리 파라미터에서 토큰 정보 추출
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const isNewUser = params.get('isNewUser') === 'true';
        const error = params.get('error');
        const message = params.get('message');

        // 에러 처리
        if (error) {
          console.error('Naver OAuth 에러:', error, message);
          setErrorMessage(message || '네이버 로그인에 실패했습니다.');
          setStatus('error');
          return;
        }

        if (!token) {
          console.error('Naver OAuth: 토큰이 없습니다');
          setErrorMessage('인증 토큰을 받지 못했습니다.');
          setStatus('error');
          return;
        }

        // 토큰 저장 및 사용자 정보 로드
        console.log('Naver 로그인 성공, 토큰 저장 중...');

        // 먼저 토큰만 저장 (API 호출에 필요)
        (webApiService.auth as any).setAuthTokenOnly(token);

        // 사용자 프로필 정보 가져오기
        try {
          const profileResponse = await webApiService.auth.getUserProfile();
          if (profileResponse.data?.user) {
            await webApiService.auth.setAuthToken(token, profileResponse.data.user);
          }
        } catch (profileError) {
          console.warn('사용자 프로필 로드 실패, 토큰만 저장:', profileError);
          // 프로필 로드 실패해도 토큰은 저장됨 - 다음 페이지에서 재시도 가능
        }

        // 신규 사용자인 경우 약관 동의 화면 표시
        if (isNewUser) {
          console.log('신규 사용자 - 약관 동의 필요');

          // 사용자 정보 가져오기
          let userInfo: SocialNewUserInfo = {
            provider: 'naver',
            userId: '',
            name: '',
            email: '',
          };

          try {
            const profileResponse = await webApiService.auth.getUserProfile();
            if (profileResponse.data?.user) {
              userInfo = {
                provider: 'naver',
                userId: String(profileResponse.data.user.id || ''),
                name: profileResponse.data.user.name || '',
                email: profileResponse.data.user.email || '',
                profileImage: profileResponse.data.user.avatar || '',
              };
            }
          } catch (e) {
            console.warn('사용자 정보 로드 실패:', e);
          }

          setNewUserInfo(userInfo);
          setStatus('terms');
          return;
        }

        // 기존 사용자 - 인증 상태 변경 이벤트 발생 후 홈으로 이동
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        setStatus('success');

        setTimeout(() => {
          if (onGo) {
            onGo('/');
          } else {
            window.location.href = '/';
          }
        }, 1500);

      } catch (error: any) {
        console.error('Naver 콜백 처리 중 오류:', error);
        setErrorMessage(error.message || '로그인 처리 중 오류가 발생했습니다.');
        setStatus('error');
      }
    };

    processCallback();
  }, [onGo]);

  // 약관 동의 완료 핸들러
  const handleTermsComplete = () => {
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    if (onGo) {
      onGo('/');
    } else {
      window.location.href = '/';
    }
  };

  // 약관 동의 취소 시 로그인 페이지로 이동
  const handleTermsClose = () => {
    // 토큰 삭제 (가입 취소)
    webApiService.auth.clearAuthToken();
    if (onGo) {
      onGo('/login');
    } else {
      window.location.href = '/login';
    }
  };

  // 약관 동의 화면 (신규 사용자)
  if (status === 'terms' && newUserInfo) {
    return (
      <div className="min-h-screen bg-white">
        <SocialTermsStep
          userInfo={newUserInfo}
          onComplete={handleTermsComplete}
          onClose={handleTermsClose}
        />
      </div>
    );
  }

  // 에러 상태
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => {
              if (onGo) {
                onGo('/login');
              } else {
                window.location.href = '/login';
              }
            }}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            다시 로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 성공 상태
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 성공!</h2>
          <p className="text-gray-600">잠시 후 이동합니다...</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
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
