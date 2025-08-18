
import { products } from '../../data';

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
  // 샘플 사용자 / 집계
  const me = {
    nickname: "speed1",
    level: "HANDY+",
    points: 2300,
    coupons: 2,
    ordersWaiting: 0,
    shipping: 0,
    cs: 0,
    likes: 23,
  };

  // 작은 유틸
  const Right = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const Stat = ({
    label,
    value,
    to,
  }: {
    label: string;
    value: string;
    to: string;
  }) => (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo(to);
      }}
      className="flex-1 rounded-lg border bg-white p-3 text-left hover:bg-gray-50"
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </a>
  );

  const LinkRow = ({
    title,
    to,
    note,
  }: {
    title: string;
    to: string;
    note?: string;
  }) => (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo(to);
      }}
      className="flex items-center justify-between border-b py-3 text-sm hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <span>{title}</span>
        {note ? (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {note}
          </span>
        ) : null}
      </div>
      <Right />
    </a>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="mt-6 rounded-lg border bg-white">
      <div className="border-b px-4 py-3 text-[15px] font-semibold">
        {title}
      </div>
      <div className="px-4">{children}</div>
    </section>
  );

  // 최근 본 상품(샘플 데이터 사용)
  const recent = products.slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      {/* 상단 요약 바 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">내 정보</div>
            <div className="mt-1 text-lg font-semibold">
              {me.nickname} <span className="text-gray-400">/</span>{" "}
              <span className="text-blue-600">{me.level}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/my/settings"
              onClick={(e) => {
                e.preventDefault();
                onGo("/my/settings");
              }}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              설정
            </a>
            <a
              href="/logout"
              onClick={(e) => {
                e.preventDefault();
                alert("로그아웃(데모)");
              }}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              로그아웃
            </a>
          </div>
        </div>

        {/* 요약 통계 4분할 */}
        <div className="mt-3 flex gap-2">
          <Stat label="주문/배송" value={`${me.ordersWaiting}건`} to="/my/orders" />
          <Stat label="배송중" value={`${me.shipping}건`} to="/my/shipping" />
          <Stat label="포인트" value={`${me.points.toLocaleString()}P`} to="/my/points" />
          <Stat label="쿠폰" value={`${me.coupons}장`} to="/my/coupons" />
        </div>

        {/* 프로모션 배너 */}
        <a
          href="/promo/plus"
          onClick={(e) => {
            e.preventDefault();
            onGo("/promo/plus");
          }}
          className="mt-4 block rounded-lg bg-blue-600 px-4 py-3 text-white"
        >
          <div className="text-sm opacity-90">핸디플러스 멤버</div>
          <div className="text-[15px] font-semibold">
            멤버십 최대 10% 적립 혜택
          </div>
        </a>
      </div>

      {/* 최근 본 / 위시리스트 요약 */}
      <Section title="최근 본">
        {recent.length === 0 ? (
          <div className="py-6 text-sm text-gray-500">최근 본 상품이 없습니다.</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto py-3">
            {recent.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="w-[140px] shrink-0 text-left"
                title={p.name}
              >
                <img
                  src={p.image}
                  className="aspect-[3/4] w-full rounded object-cover"
                />
                <div className="mt-1 line-clamp-2 text-xs">{p.name}</div>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* 주문/반품/리뷰 등 주요 메뉴 */}
      <Section title="주문·배송 / 반품·교환">
        <div className="divide-y">
          <LinkRow title="주문 내역" to="/my/orders" />
          <LinkRow title="반품/교환 내역" to="/my/claims" />
          <LinkRow title="취소 내역" to="/my/cancel" />
        </div>
      </Section>

      <Section title="리뷰·좋아요">
        <div className="divide-y">
          <LinkRow title="내 리뷰 관리" to="/my/reviews" />
          <LinkRow title="좋아요(위시리스트)" to="/likes" note={`${me.likes}`} />
        </div>
      </Section>

      <Section title="혜택 / 결제">
        <div className="divide-y">
          <LinkRow title="쿠폰" to="/my/coupons" note={`${me.coupons}장`} />
          <LinkRow title="포인트" to="/my/points" note={`${me.points.toLocaleString()}P`} />
          <LinkRow title="결제수단 관리" to="/my/payments" />
        </div>
      </Section>

      <Section title="고객센터 / 설정">
        <div className="divide-y">
          <LinkRow title="1:1 문의" to="/support/contact" />
          <LinkRow title="FAQ" to="/support/faq" />
          <LinkRow title="알림/푸시 설정" to="/my/notifications" />
          <LinkRow title="회원정보 수정" to="/my/settings" />
        </div>
      </Section>
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