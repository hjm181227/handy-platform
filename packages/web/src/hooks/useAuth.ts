import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

/**
 * 인증 상태 접근 Hook
 *
 * @returns AuthContext의 상태 및 메서드
 * @throws AuthContext 외부에서 사용 시 에러
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { currentUser, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>로그인이 필요합니다</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>환영합니다, {currentUser?.name}님!</p>
 *       <button onClick={logout}>로그아웃</button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider. ' +
        'Make sure your component is wrapped with <AuthProvider>.'
    );
  }

  return context;
}
