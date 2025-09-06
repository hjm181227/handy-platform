import { CartContent } from '../cart/CartContent';

interface CartPageProps {
  onBack: () => void;
  onCheckout?: () => void;
  onCartUpdate?: () => void;
}

export function CartPage({ onBack, onCheckout, onCartUpdate }: CartPageProps) {
  const handleCheckout = onCheckout || (() => {
    // TODO: Milestone 3에서 체크아웃 페이지로 이동
    alert('체크아웃 기능은 곧 구현됩니다!');
  });

  return (
    <CartContent 
      mode="page"
      onBack={onBack}
      onCheckout={handleCheckout}
      onCartUpdate={onCartUpdate}
    />
  );
}