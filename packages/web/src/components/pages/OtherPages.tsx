
// 간단한 더미 페이지들
export function LikesPage({ onGo, onOpen }: { onGo: (to: string) => void; onOpen: (id: string) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">찜한 상품</h1>
      <div className="mt-4 text-center py-20 text-gray-500">
        <p>찜한 상품이 없습니다.</p>
        <button onClick={() => onGo("/")} className="mt-4 rounded border px-4 py-2 text-sm">쇼핑하러 가기</button>
      </div>
    </div>
  );
}

export function MyPage({ onGo, onOpen }: { onGo: (to: string) => void; onOpen: (id: string) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">마이페이지</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">주문 내역</h3>
          <p className="text-sm text-gray-600 mt-1">최근 주문을 확인하세요</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">배송 조회</h3>
          <p className="text-sm text-gray-600 mt-1">배송 상황을 실시간으로 확인</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">리뷰 관리</h3>
          <p className="text-sm text-gray-600 mt-1">구매한 상품의 리뷰 작성</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">쿠폰함</h3>
          <p className="text-sm text-gray-600 mt-1">사용 가능한 쿠폰 확인</p>
        </div>
      </div>
    </div>
  );
}

export function SnapPage({ onGo, onOpen }: { onGo: (to: string) => void; onOpen: (id: string) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">SNAP</h1>
      <p className="text-sm text-gray-600">네일 아트 갤러리</p>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
            <img 
              src={`https://picsum.photos/seed/snap-${i}/400/400`} 
              className="w-full h-full object-cover" 
              alt={`Snap ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}