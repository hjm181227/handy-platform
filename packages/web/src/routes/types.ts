import { ComponentType } from 'react';

/**
 * 레이아웃 타입
 */
export type LayoutType = 'main' | 'seller' | 'admin' | 'none';

/**
 * 라우트 설정 인터페이스
 */
export interface RouteConfig {
  /** 경로 (예: '/product/:id') */
  path: string;
  /** 경로 매칭을 위한 정규식 (동적 라우트용) */
  pattern?: RegExp;
  /** 렌더링할 컴포넌트 (함수형 또는 JSX 반환 함수) */
  component?: ComponentType<RouteComponentProps>;
  /** 렌더 함수 (복잡한 props 전달이 필요한 경우) */
  render?: (props: RouteComponentProps) => JSX.Element;
  /** 레이아웃 타입 */
  layout?: LayoutType;
  /** 인증 필요 여부 */
  requireAuth?: boolean;
  /** 필요한 역할 */
  requireRole?: 'user' | 'seller' | 'admin';
}

/**
 * 라우트 컴포넌트 props
 */
export interface RouteComponentProps {
  /** URL 파라미터 (예: { id: '123' }) */
  params: Record<string, string>;
  /** 쿼리 파라미터 */
  query: URLSearchParams;
  /** 네비게이션 함수 */
  nav: (to: string) => void;
  /** 현재 경로 */
  pathname: string;
}

/**
 * 라우트 매칭 결과
 */
export interface RouteMatch {
  route: RouteConfig;
  params: Record<string, string>;
}
