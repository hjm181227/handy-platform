import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

// Edge Config에서 API 타겟 URL 가져오기
async function getApiTarget(): Promise<string> {
  try {
    const apiTarget = await get<string>('api_target');

    if (apiTarget) {
      console.log('[Edge Config] API Target loaded:', apiTarget);
      return apiTarget;
    }

    // Edge Config에 값이 없으면 fallback
    console.warn('[Edge Config] No api_target found, using fallback');
    return 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080';
  } catch (error) {
    console.error('[Edge Config] Failed to load api_target:', error);
    // Edge Config 실패 시 fallback
    return 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api로 시작하는 요청만 처리
  if (pathname.startsWith('/api/')) {
    // 로컬 개발 환경에서는 localhost:11000으로 프록시
    if (process.env.NODE_ENV === 'development') {
      const localBackendUrl = 'http://localhost:11000';
      const apiPath = pathname; // /api/... 그대로 유지
      const proxyUrl = `${localBackendUrl}${apiPath}${request.nextUrl.search}`;

      console.log('[Middleware - Dev] Proxying to:', proxyUrl);
      return NextResponse.rewrite(new URL(proxyUrl));
    }

    // 프로덕션/스테이징: Edge Config에서 동적으로 API 타겟 가져오기
    const apiTarget = await getApiTarget();
    const apiPath = pathname; // /api/... 그대로 유지
    const proxyUrl = `${apiTarget}${apiPath}${request.nextUrl.search}`;

    console.log('[Middleware - Prod] Proxying to:', proxyUrl);

    // 백엔드로 프록시
    return NextResponse.rewrite(new URL(proxyUrl));
  }

  // /api가 아닌 요청은 그대로 통과
  return NextResponse.next();
}

// Middleware가 실행될 경로 설정
export const config = {
  matcher: '/api/:path*',
};
