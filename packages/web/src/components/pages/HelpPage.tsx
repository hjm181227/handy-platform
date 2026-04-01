import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Footer FAQ와 동일한 FAQ 데이터
const faqs = [
  {
    id: '1',
    category: 'order',
    question: '주문 후 언제 배송되나요?',
    answer: '평일 오후 2시 이전 결제 완료 시 당일 출고됩니다. 주말/공휴일 주문은 다음 영업일에 출고되며, 배송기간은 1-2일 소요됩니다. 제주도 및 도서산간 지역은 추가 1-2일이 소요될 수 있습니다.'
  },
  {
    id: '2',
    category: 'order',
    question: '배송비는 얼마인가요?',
    answer: '2만원 이상 구매시 무료배송입니다. 2만원 미만 구매시 배송비 2,500원이 부과됩니다. 제주도는 추가 3,000원, 기타 도서산간 지역은 추가 5,000원이 부과됩니다.'
  },
  {
    id: '3',
    category: 'product',
    question: '네일팁 사이즈는 어떻게 선택하나요?',
    answer: '네일팁 사이즈표를 참고하여 본인의 손톱 너비에 맞는 사이즈를 선택하세요. 사이즈가 애매한 경우 작은 사이즈를 선택하여 사용하시는 것을 권장합니다. 각 제품 상세페이지에서 정확한 사이즈 가이드를 확인할 수 있습니다.'
  },
  {
    id: '4',
    category: 'product',
    question: '젤 네일의 지속력은 얼마나 되나요?',
    answer: '개인의 생활패턴과 손톱 상태에 따라 차이가 있지만, 일반적으로 2-3주간 유지됩니다. 베이스코트, 컬러젤, 탑코트를 순서대로 발라 UV/LED 램프로 충분히 경화시키면 더 오래 지속됩니다.'
  },
  {
    id: '5',
    category: 'payment',
    question: '어떤 결제 방법을 사용할 수 있나요?',
    answer: '신용카드, 체크카드, 카카오페이, 네이버페이, 계좌이체, 무통장입금을 지원합니다. 모든 결제는 안전한 PG사를 통해 처리되며, 개인정보는 암호화하여 보호됩니다.'
  },
  {
    id: '6',
    category: 'payment',
    question: '할부 결제가 가능한가요?',
    answer: '신용카드 결제시 2-12개월 무이자 할부가 가능합니다. (카드사별로 무이자 개월 수 상이) 5만원 이상 구매시 할부 결제를 선택할 수 있으며, 자세한 내용은 결제 단계에서 확인하실 수 있습니다.'
  },
  {
    id: '7',
    category: 'return',
    question: '교환/환불은 어떻게 하나요?',
    answer: '상품 수령 후 7일 이내에 고객센터로 연락주시면 됩니다. 단순변심의 경우 왕복배송비가 부과되며, 상품불량의 경우 무료로 교환/환불 처리해드립니다. 사용한 제품은 교환/환불이 불가능합니다.'
  },
  {
    id: '8',
    category: 'return',
    question: '환불은 언제 완료되나요?',
    answer: '반품 상품 확인 후 3-5영업일 이내에 환불 처리됩니다. 신용카드는 승인취소(2-3일), 계좌이체는 계좌입금(3-5일) 방식으로 진행되며, 결제사별로 환불 시점이 다를 수 있습니다.'
  },
  {
    id: '9',
    category: 'membership',
    question: '회원 등급 혜택이 있나요?',
    answer: '구매 금액에 따라 실버, 골드, VIP 등급으로 나뉩니다. 등급별로 적립금 적립률(1-5%), 무료배송 혜택, 생일쿠폰, 신상품 우선 구매 등의 혜택을 제공합니다.'
  },
  {
    id: '10',
    category: 'membership',
    question: '적립금은 어떻게 사용하나요?',
    answer: '적립금은 3,000원 이상부터 사용 가능하며, 상품 금액의 최대 20%까지 사용할 수 있습니다. 적립금 사용에는 별도의 유효기간이 없으며, 주문 시 자동으로 적립됩니다.'
  },
  {
    id: '11',
    category: 'other',
    question: 'UV 램프는 꼭 필요한가요?',
    answer: '젤 네일 제품을 사용하실 경우 UV 또는 LED 램프가 필수입니다. 네일팁이나 일반 매니큐어 제품은 램프 없이도 사용 가능합니다. 처음 시작하시는 분들을 위한 스타터 키트도 판매하고 있습니다.'
  },
  {
    id: '12',
    category: 'other',
    question: '네일아트 초보인데 튜토리얼이 있나요?',
    answer: '유튜브 채널과 블로그에서 상세한 네일아트 튜토리얼을 제공합니다. 기초부터 고급 기법까지 단계별로 설명하고 있으며, 제품 구매 시 간단한 가이드북도 함께 제공됩니다.'
  }
];

export function HelpPage({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('common');
  // const tel = "1544-7199"; // 고객센터 연결 제거
  const email = "hermosear98@gmail.com";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("[HANDY] 문의")}&body=${encodeURIComponent("안녕하세요, 문의드립니다.\n\n주문번호:\n내용:")}`;

  const openChat = () => {
    // 웹에선 /support/contact 로 이동, 앱에선 브릿지 메세지 전송
    try { (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "open-chat" })); } catch {}
    onGo("/support/contact");
  };

  const [query, setQuery] = useState("");
  const filtered = faqs.filter(f => {
    const q = query.trim();
    return q === "" || (f.question + f.answer).toLowerCase().includes(q.toLowerCase());
  });

  const ActionBtn = ({ icon, label, href, onClick }:{
    icon: React.ReactNode; label: string; href?: string; onClick?: ()=>void;
  }) => (
    href ? (
      <a href={href} className="flex-1 rounded-xl border bg-white px-4 py-3 text-center hover:bg-gray-50">
        <div className="mx-auto mb-1 h-6 w-6">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
      </a>
    ) : (
      <button onClick={onClick} className="flex-1 rounded-xl border bg-white px-4 py-3 hover:bg-gray-50">
        <div className="mx-auto mb-1 h-6 w-6">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
      </button>
    )
  );

  const PhoneI = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="currentColor"/></svg>);
  const MailI  = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>);
  const ChatI  = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>);

  const FAQItem = ({ f }: { f: typeof faqs[0] }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="rounded-lg border bg-white">
        <button onClick={() => setOpen(v=>!v)} className="w-full px-4 py-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{f.question}</span>
            <span className="text-gray-400">{open ? "−" : "+"}</span>
          </div>
        </button>
        {open && <div className="px-4 pb-4 text-sm text-gray-700">{f.answer}</div>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">HELP</h1>
      <p className="text-sm text-gray-600">{t('support.helpSubtitle')}</p>

      {/* 핵심 액션 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ActionBtn icon={<MailI/>}  label={t('support.sendEmail')} href={mailto} />
        <ActionBtn icon={<ChatI/>}  label={t('support.liveChat')} onClick={openChat} />
      </div>

      {/* 운영 정보 / 안내 */}
      <div className="mt-3 rounded-lg bg-gray-100 px-4 py-3 text-xs text-gray-700">
        {t('support.csHours')}
      </div>

      {/* 검색 */}
      <div className="mt-5">
        <div className="flex items-center gap-2 rounded-full border px-4 py-2 bg-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-500" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
          </svg>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder={t('support.faqSearch')}
            className="w-full text-sm outline-none border-0 focus:outline-none focus:border-0 focus:ring-0"
          />
        </div>
      </div>

      {/* FAQ 리스트 */}
      <div className="mt-4 space-y-2">
        {filtered.map((f, i) => <FAQItem key={i} f={f} />)}
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white px-4 py-6 text-center text-sm text-gray-500">
            {t('support.noFaqResults')}
          </div>
        )}
      </div>

      {/* 추가 안내 */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-zinc-900 to-gray-800 p-5 text-white">
        <div className="text-[15px] font-semibold">{t('support.needMoreHelp')}</div>
        <p className="mt-1 text-sm text-white/80">{t('support.prepareOrderNumber')}</p>
        <div className="mt-3 flex gap-2">
          <a href={mailto} className="rounded-full bg-white px-4 py-1.5 text-sm text-black">{t('support.emailInquiry')}</a>
          <button onClick={openChat} className="rounded-full bg-white/10 px-4 py-1.5 text-sm">{t('support.liveConsult')}</button>
        </div>
      </div>
    </div>
  );
}
