import { useEffect, useState, useRef } from 'react';
import { webApiService } from '../../services/apiService';
import { SocialTermsStep } from '../auth/SocialTermsStep';
import { SocialNewUserInfo } from '../../contexts/AuthModalContext';

interface GoogleCallbackPageProps {
  onGo?: (path: string) => void;
}

/**
 * Google OAuth 콜백 페이지 (백엔드 주도 방식)
 *
 * 백엔드에서 OAuth 처리 후 리다이렉트되는 페이지입니다.
 * URL 쿼리 파라미터에서 stateId를 추출하여 인증 데이터를 조회합니다.
 */
export function GoogleCallbackPage({ onGo }: GoogleCallbackPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'terms'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newUserInfo, setNewUserInfo] = useState<SocialNewUserInfo | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // 이미 처리 중이면 중복 실행 방지
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;

      try {
        // URL 쿼리 파라미터에서 정보 추출
        const params = new URLSearchParams(window.location.search);
        const stateId = params.get('stateId');
        const error = params.get('error');
        const message = params.get('message');

        // URL 정리 (민감한 정보 제거)
        window.history.replaceState({}, document.title, '/auth/google/callback');

        // 에러 처리
        if (error) {
          console.error('Google OAuth 에러:', error, message);
          setErrorMessage(message || 'Google 로그인에 실패했습니다.');
          setStatus('error');
          return;
        }

        // stateId 없으면 에러
        if (!stateId) {
          console.error('Google OAuth: stateId가 없습니다');
          setErrorMessage('인증 정보가 없습니다. 다시 로그인해주세요.');
          setStatus('error');
          return;
        }

        // stateId로 인증 데이터 조회 (일회용)
        console.log('Google OAuth: stateId로 인증 데이터 조회 중...');
        const response = await webApiService.auth.getGoogleAuthData(stateId);

        if (response.needsSignup && response.socialUserInfo) {
          // 신규 사용자 - 약관 동의 화면
          console.log('신규 사용자 - 약관 동의 필요');
          setNewUserInfo({
            provider: 'google',
            userId: response.socialUserInfo.providerId,
            name: response.socialUserInfo.name || '',
            email: response.socialUserInfo.email || '',
            profileImage: response.socialUserInfo.profileImage || '',
          });
          setStatus('terms');
          return;
        }

        // 기존 사용자 - 토큰 저장 및 로그인 완료
        if (response.token && response.user) {
          console.log('Google 로그인 성공, 토큰 저장 중...');
          await webApiService.auth.setAuthToken(response.token, response.user);
          window.dispatchEvent(new CustomEvent('authStateChanged'));
          setStatus('success');

          setTimeout(() => {
            if (onGo) {
              onGo('/');
            } else {
              window.location.href = '/';
            }
          }, 1500);
        }

      } catch (error: any) {
        console.error('Google 콜백 처리 중 오류:', error);

        // 410 상태 코드: 인증 정보 만료/사용됨
        if (error.status === 410) {
          setErrorMessage('인증 정보가 만료되었습니다. 다시 로그인해주세요.');
        } else {
          setErrorMessage(error.message || '로그인 처리 중 오류가 발생했습니다.');
        }
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
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Google 로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default GoogleCallbackPage;
