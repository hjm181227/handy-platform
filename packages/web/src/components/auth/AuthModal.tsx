import { useAuthModal } from '../../contexts/AuthModalContext';
import { AuthModalContent } from './AuthModalContent';

export function AuthModal() {
  const { isOpen, currentView } = useAuthModal();

  if (!currentView) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-white z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 모달 컨테이너 */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-full w-full bg-white overflow-y-auto">
          <AuthModalContent />
        </div>
      </div>
    </>
  );
}
