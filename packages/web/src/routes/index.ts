import { RouteConfig, RouteMatch } from './types';
import { publicRoutes } from './publicRoutes';
import { authRoutes } from './authRoutes';
import { sellerRoutes } from './sellerRoutes';
import { adminRoutes } from './adminRoutes';

export * from './types';
export { publicRoutes } from './publicRoutes';
export { authRoutes } from './authRoutes';
export { sellerRoutes } from './sellerRoutes';
export { adminRoutes } from './adminRoutes';

/**
 * 모든 라우트 통합 (순서 중요: 구체적인 패턴이 먼저)
 */
export const allRoutes: RouteConfig[] = [
  ...adminRoutes,    // /admin/* - 가장 구체적
  ...sellerRoutes,   // /seller/* - 구체적
  ...authRoutes,     // 인증 필요 라우트
  ...publicRoutes,   // 공개 라우트 (가장 일반적)
];

/**
 * URL 경로에서 파라미터 추출
 * @param pattern 라우트 패턴 (예: '/product/:id')
 * @param pathname 현재 경로 (예: '/product/123')
 * @returns 파라미터 객체 (예: { id: '123' })
 */
function extractParams(pattern: string, pathname: string): Record<string, string> {
  const params: Record<string, string> = {};

  // ':param' 형태의 파라미터 추출
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = decodeURIComponent(pathParts[index] || '');
    }
  });

  return params;
}

/**
 * 정규식 패턴에서 파라미터 추출
 * @param regex 정규식 패턴
 * @param pathname 현재 경로
 * @param pattern 라우트 패턴 (파라미터 이름 추출용)
 * @returns 파라미터 객체
 */
function extractParamsFromRegex(
  regex: RegExp,
  pathname: string,
  pattern: string
): Record<string, string> {
  const match = pathname.match(regex);
  if (!match) return {};

  const params: Record<string, string> = {};
  const paramNames = pattern.match(/:(\w+)/g) || [];

  paramNames.forEach((param, index) => {
    const paramName = param.slice(1);
    params[paramName] = decodeURIComponent(match[index + 1] || '');
  });

  return params;
}

/**
 * 현재 경로와 일치하는 라우트 찾기
 * @param pathname 현재 URL 경로
 * @returns 일치하는 라우트와 파라미터, 없으면 null
 */
export function matchRoute(pathname: string): RouteMatch | null {
  for (const route of allRoutes) {
    // 정규식 패턴이 있으면 정규식으로 매칭
    if (route.pattern) {
      if (route.pattern.test(pathname)) {
        return {
          route,
          params: extractParamsFromRegex(route.pattern, pathname, route.path),
        };
      }
    }
    // 정확한 경로 매칭
    else if (pathname === route.path) {
      return {
        route,
        params: {},
      };
    }
  }

  return null;
}

/**
 * 경로가 특정 레이아웃 타입에 속하는지 확인
 * @param pathname 현재 경로
 * @param layoutType 레이아웃 타입
 */
export function isLayoutType(pathname: string, layoutType: 'main' | 'seller' | 'admin' | 'none'): boolean {
  const match = matchRoute(pathname);
  return match?.route.layout === layoutType;
}

/**
 * 경로가 인증이 필요한지 확인
 * @param pathname 현재 경로
 */
export function requiresAuth(pathname: string): boolean {
  const match = matchRoute(pathname);
  return match?.route.requireAuth ?? false;
}

/**
 * 경로에 필요한 역할 확인
 * @param pathname 현재 경로
 */
export function getRequiredRole(pathname: string): 'user' | 'seller' | 'admin' | undefined {
  const match = matchRoute(pathname);
  return match?.route.requireRole;
}
