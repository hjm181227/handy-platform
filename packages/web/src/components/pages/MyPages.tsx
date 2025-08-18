import { useState } from 'react';
import { products } from '../../data';

// 공통 컴포넌트들
const BackButton = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <div className="border-b bg-white px-4 py-3">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="text-gray-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  </div>
);

const EmptyState = ({ title, description, actionText, onAction }: { 
  title: string; 
  description: string; 
  actionText?: string; 
  onAction?: () => void;
}) => (
  <div className="mx-auto max-w-sm px-6 py-20 text-center">
    <div className="mb-4 text-4xl">📦</div>
    <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mb-6 text-sm text-gray-500">{description}</p>
    {actionText && onAction && (
      <button 
        onClick={onAction}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {actionText}
      </button>
    )}
  </div>
);

// 주문 내역 페이지
export function OrdersPage({ onGo }: { onGo: (to: string) => void }) {
  const orders = [
    { id: "2024081801", date: "2024-08-18", status: "배송중", items: ["Glossy Almond Tip – Milk Beige", "Square Short – Cocoa"], total: 35000, trackingNumber: "123456789" },
    { id: "2024081502", date: "2024-08-15", status: "배송완료", items: ["Gel Press – Clear Fit"], total: 12000 },
    { id: "2024081203", date: "2024-08-12", status: "주문완료", items: ["Oval Short – Mauve", "Cuticle Oil – Rose"], total: 30000 },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "주문완료": return "bg-blue-100 text-blue-700";
      case "배송중": return "bg-orange-100 text-orange-700";
      case "배송완료": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="주문 내역" />
      <div className="p-4 space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{order.date}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="mb-3">
              <div className="font-medium mb-1">주문번호: {order.id}</div>
              <div className="text-sm text-gray-600 mb-2">
                {order.items.join(", ")} 외 {order.items.length - 1}개
              </div>
              <div className="font-semibold">{order.total.toLocaleString()}원</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-4 text-sm border rounded-lg hover:bg-gray-50">
                주문상세
              </button>
              {order.trackingNumber && (
                <button className="flex-1 py-2 px-4 text-sm border rounded-lg hover:bg-gray-50">
                  배송조회
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 배송중 주문 페이지
export function ShippingPage({ onGo }: { onGo: (to: string) => void }) {
  const shippingOrders = [
    { 
      id: "2024081801", 
      date: "2024-08-18",
      items: ["Glossy Almond Tip – Milk Beige"],
      trackingNumber: "123456789",
      courier: "한진택배",
      status: "배송중",
      estimatedDelivery: "2024-08-20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="배송중 주문" />
      <div className="p-4 space-y-4">
        {shippingOrders.length === 0 ? (
          <EmptyState
            title="배송중인 주문이 없습니다"
            description="주문하신 상품이 없거나 이미 배송이 완료되었습니다."
            actionText="쇼핑하러 가기"
            onAction={() => onGo("/")}
          />
        ) : (
          shippingOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">주문일: {order.date}</span>
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  {order.status}
                </span>
              </div>
              <div className="mb-4">
                <div className="font-medium mb-1">{order.items.join(", ")}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {order.courier} | {order.trackingNumber}
                </div>
                <div className="text-sm text-blue-600">
                  예상 도착일: {order.estimatedDelivery}
                </div>
              </div>
              <button className="w-full py-2 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                실시간 배송조회
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 반품/교환 내역 페이지
export function ClaimsPage({ onGo }: { onGo: (to: string) => void }) {
  const claims: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="반품/교환 내역" />
      <div className="p-4">
        {claims.length === 0 ? (
          <EmptyState
            title="반품/교환 내역이 없습니다"
            description="반품이나 교환 요청 내역이 없습니다."
            actionText="주문 내역 보기"
            onAction={() => onGo("/my/orders")}
          />
        ) : (
          <div className="space-y-4">
            {/* 반품/교환 내역이 있을 때 렌더링 */}
          </div>
        )}
      </div>
    </div>
  );
}

// 취소 내역 페이지
export function CancelPage({ onGo }: { onGo: (to: string) => void }) {
  const cancelledOrders: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="취소 내역" />
      <div className="p-4">
        {cancelledOrders.length === 0 ? (
          <EmptyState
            title="취소 내역이 없습니다"
            description="주문 취소 내역이 없습니다."
            actionText="쇼핑하러 가기"
            onAction={() => onGo("/")}
          />
        ) : (
          <div className="space-y-4">
            {/* 취소 내역이 있을 때 렌더링 */}
          </div>
        )}
      </div>
    </div>
  );
}

// 리뷰 관리 페이지
export function ReviewsPage({ onGo }: { onGo: (to: string) => void }) {
  const reviews = [
    { id: 1, product: "Glossy Almond Tip – Milk Beige", rating: 5, content: "색상도 예쁘고 품질이 좋아요!", date: "2024-08-15", image: "https://picsum.photos/id/1060/800/800" },
    { id: 2, product: "Square Short – Cocoa", rating: 4, content: "사이즈가 딱 맞아서 만족합니다.", date: "2024-08-10", image: "https://picsum.photos/id/1059/800/800" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="내 리뷰 관리" />
      <div className="p-4 space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg border p-4">
            <div className="flex gap-3 mb-3">
              <img src={review.image} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="font-medium mb-1">{review.product}</div>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">{review.date}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 mb-3">{review.content}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">수정</button>
              <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-red-600">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 쿠폰함 페이지
export function CouponsPage({ onGo }: { onGo: (to: string) => void }) {
  const coupons = [
    { id: 1, name: "신규회원 10% 할인", discount: 10, type: "percent", minOrder: 50000, expiry: "2024-12-31", used: false },
    { id: 2, name: "5천원 할인쿠폰", discount: 5000, type: "fixed", minOrder: 30000, expiry: "2024-09-30", used: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="쿠폰함" />
      <div className="p-4 space-y-3">
        {coupons.map(coupon => (
          <div key={coupon.id} className={`bg-white rounded-lg border-2 ${coupon.used ? 'border-gray-200 opacity-50' : 'border-blue-200'} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{coupon.name}</div>
              <div className={`text-lg font-bold ${coupon.used ? 'text-gray-400' : 'text-blue-600'}`}>
                {coupon.type === 'percent' ? `${coupon.discount}%` : `${coupon.discount.toLocaleString()}원`}
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {coupon.minOrder.toLocaleString()}원 이상 구매 시 • {coupon.expiry}까지
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs px-2 py-1 rounded ${coupon.used ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                {coupon.used ? '사용완료' : '사용가능'}
              </span>
              {!coupon.used && (
                <button className="text-xs text-blue-600 hover:underline">바로사용</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 포인트 페이지
export function PointsPage({ onGo }: { onGo: (to: string) => void }) {
  const currentPoints = 2300;
  const pointHistory = [
    { id: 1, type: "적립", amount: 230, reason: "주문완료 적립", date: "2024-08-15", orderId: "2024081502" },
    { id: 2, type: "사용", amount: -500, reason: "주문 시 포인트 사용", date: "2024-08-12", orderId: "2024081203" },
    { id: 3, type: "적립", amount: 300, reason: "리뷰작성 적립", date: "2024-08-10", orderId: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="포인트" />
      
      {/* 포인트 요약 */}
      <div className="bg-white border-b p-6">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">보유 포인트</div>
          <div className="text-3xl font-bold text-blue-600 mb-4">{currentPoints.toLocaleString()}P</div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
            포인트 사용하기
          </button>
        </div>
      </div>

      {/* 포인트 내역 */}
      <div className="p-4">
        <h3 className="font-medium mb-3">포인트 내역</h3>
        <div className="space-y-3">
          {pointHistory.map(history => (
            <div key={history.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{history.reason}</div>
                <div className="text-xs text-gray-500">{history.date}</div>
                {history.orderId && (
                  <div className="text-xs text-gray-400">주문번호: {history.orderId}</div>
                )}
              </div>
              <div className={`font-semibold ${history.type === '적립' ? 'text-blue-600' : 'text-red-600'}`}>
                {history.type === '적립' ? '+' : ''}{history.amount.toLocaleString()}P
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 결제수단 관리 페이지
export function PaymentsPage({ onGo }: { onGo: (to: string) => void }) {
  const [cards] = useState([
    { id: 1, type: "신용카드", name: "KB국민카드", number: "**** **** **** 1234", isDefault: true },
    { id: 2, type: "체크카드", name: "신한카드", number: "**** **** **** 5678", isDefault: false },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="결제수단 관리" />
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-medium">등록된 카드</h3>
          <button className="text-sm text-blue-600 hover:underline">+ 카드 추가</button>
        </div>
        
        <div className="space-y-3">
          {cards.map(card => (
            <div key={card.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{card.name}</div>
                {card.isDefault && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">기본</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">{card.number}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">수정</button>
                <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-red-600">삭제</button>
                {!card.isDefault && (
                  <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">기본으로 설정</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}