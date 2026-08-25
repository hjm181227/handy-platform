import React, { useState } from 'react';

// 공통 페이지 레이아웃
const PageLayout = ({ 
  title, 
  onBack, 
  children 
}: { 
  title: string; 
  onBack: () => void; 
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-gray-50">
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
    <div className="mx-auto max-w-4xl p-4">
      {children}
    </div>
  </div>
);

// 1:1 문의하기 페이지
/**
 * 1:1 문의 — 실제로 닿는 창구만 안내한다.
 *
 * 이전에는 입력 폼이 있었지만 제출해도 서버로 가지 않고 "접수되었습니다"
 * 알림만 띄웠다. 손님은 답을 기다리고 운영자는 문의가 온 줄도 모르는
 * 상태였으므로, 실제로 답할 수 있는 채널로만 안내하도록 바꿨다.
 */
export function ContactInquiryPageSimple({ onGo }: { onGo: (to: string) => void }) {
  const KAKAO_CHANNEL_CHAT = 'http://pf.kakao.com/_xjWESX/chat';
  const SUPPORT_EMAIL = 'hermosear98@gmail.com';
  const SUPPORT_PHONE = '010-9611-1711';

  return (
    <PageLayout title="문의하기" onBack={() => onGo("/")}>
      <div className="bg-white rounded-xl p-6">
        <h2 className="text-xl font-bold text-ink mb-1">무엇을 도와드릴까요?</h2>
        <p className="text-[13px] text-muted mb-6">
          평일 09:00~18:00에 순서대로 답변드립니다. (점심 12:00~13:00 · 주말·공휴일 휴무)
        </p>

        {/* 카카오톡 채널 — 가장 빠른 창구 */}
        <a
          href={KAKAO_CHANNEL_CHAT}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full rounded-xl px-5 py-4 font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FEE500', color: '#191600' }}
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="flex-1 text-left">
            카카오톡으로 문의하기
            <span className="block text-[12.5px] font-normal opacity-70">
              가장 빠릅니다 · 채널 @handy_nail
            </span>
          </span>
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </a>

        {/* 그 외 창구 */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3.5 hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-muted">mail</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">이메일</span>
              <span className="block text-[12.5px] text-muted truncate">{SUPPORT_EMAIL}</span>
            </span>
          </a>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/-/g, '')}`}
            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3.5 hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-muted">call</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">전화</span>
              <span className="block text-[12.5px] text-muted [font-variant-numeric:tabular-nums]">{SUPPORT_PHONE}</span>
            </span>
          </a>
        </div>

        {/* 문의 종류별 더 빠른 길 안내 */}
        <div className="mt-8 rounded-xl bg-surface p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">이런 문의는 여기가 더 빠릅니다</h3>
          <ul className="space-y-2.5 text-[13px] text-muted">
            <li>
              <b className="font-semibold text-ink">상품·제작 문의</b> — 상품 상세 페이지의
              &lsquo;판매자에게 문의&rsquo; 버튼을 누르면 해당 판매자와 바로 대화할 수 있습니다.
            </li>
            <li>
              <b className="font-semibold text-ink">주문·배송 조회</b> —{' '}
              <button onClick={() => onGo('/my/orders')} className="text-brand font-semibold hover:underline">
                주문내역
              </button>
              에서 진행 상황을 실시간으로 확인하실 수 있습니다.
            </li>
            <li>
              <b className="font-semibold text-ink">반품·교환 신청</b> —{' '}
              <button onClick={() => onGo('/my/claims')} className="text-brand font-semibold hover:underline">
                취소·반품 내역
              </button>
              에서 직접 신청하실 수 있습니다.
            </li>
          </ul>
        </div>

        <button
          onClick={() => onGo('/faq')}
          className="mt-4 w-full rounded-full border border-line py-3 text-sm font-semibold text-ink hover:bg-surface transition-colors"
        >
          자주 묻는 질문 먼저 보기
        </button>
      </div>
    </PageLayout>
  );
}

// FAQ 페이지  
export function FaqPageSimple({ onGo }: { onGo: (to: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'order', name: '주문/배송' },
    { id: 'product', name: '상품' },
    { id: 'payment', name: '결제' },
    { id: 'return', name: '교환/환불' },
    { id: 'membership', name: '회원' },
    { id: 'other', name: '기타' }
  ];

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
      category: 'return',
      question: '디지털 콘텐츠(무형상품) 환불 규정은 어떻게 되나요?',
      answer: 'Handy 앱 내에서 구매 가능한 모든 무형상품(Pro Plan 구독, 브러시 모음, 3D 파츠 등 디지털 콘텐츠)에 적용됩니다.\n\n환불은 결제 경로에 따라 정책이 다르게 적용됩니다:\n• Apple App Store 및 Google Play Store를 통해 결제한 건은 해당 스토어의 환불 정책이 우선 적용됩니다.\n• 웹 결제(토스페이먼츠)를 통해 결제한 건은 당사의 환불 정책에 따라 처리됩니다.\n\n전자상거래 등에서의 소비자보호에 관한 법률 제17조에 따라, 결제일로부터 7일 이내에 청약철회를 요청할 수 있습니다. 단, 유료 기능을 1회라도 사용하거나 에셋을 캔버스에 적용한 경우, 동법 제17조 제2항 제5호에 따라 청약철회가 제한됩니다.'
    },
    {
      id: '10',
      category: 'return',
      question: '구독 상품(Pro Plan) 환불은 어떻게 하나요?',
      answer: '결제 경로에 따라 환불 절차가 다릅니다.\n\n【Apple App Store】 reportaproblem.apple.com에서 직접 환불을 신청해 주세요. 개발사가 직접 환불을 처리할 수 없으며, Apple의 정책에 따라 구매일로부터 90일 이내 신청 가능합니다.\n\n【Google Play Store】 Play Store → 결제 및 구독 → 주문에서 구매일로부터 48시간 이내 직접 환불 요청이 가능합니다. 48시간 경과 시 Google 고객센터를 통해 문의해 주세요.\n\n【웹 결제(토스페이먼츠)】 고객센터(hermosear98@gmail.com)로 직접 환불을 신청해 주세요. 카드 승인 취소는 영업일 기준 2~3일, 계좌 환입은 3~5일이 소요될 수 있습니다.\n\n결제 후 Pro 전용 기능(프리미엄 브러시·재질 사용, 고해상도 내보내기, 프로젝트 제한 초과 생성 등)을 1회라도 사용한 경우 청약철회가 제한됩니다. 미사용 상태에서 결제일로부터 7일 이내인 경우 전액 환불이 가능합니다.\n\n구독 취소(자동 갱신 해지)는 각 스토어의 구독 관리 메뉴 또는 앱 내 설정에서 가능하며, 취소 후에도 현재 결제 기간까지 Pro 혜택이 유지됩니다.'
    },
    {
      id: '11',
      category: 'return',
      question: '단건 구매 상품(브러시 모음, 3D 파츠 등) 환불은 가능한가요?',
      answer: '결제 경로와 사용 여부에 따라 환불 가능 여부가 달라집니다.\n\n【환불 가능 조건】\n결제일로부터 7일 이내이며, 구매한 에셋을 캔버스에 1회도 적용하지 않은 경우 전액 환불이 가능합니다.\n\n【환불이 제한되는 경우】\n• 에셋을 캔버스에 1회 이상 적용한 이력이 있는 경우 (전자상거래법 제17조 제2항 제5호)\n• 결제일로부터 7일이 경과한 경우\n• 번들(모음) 상품의 경우, 포함된 에셋 중 하나라도 캔버스에 적용한 이력이 있으면 전체 환불 불가\n\n【결제 경로별 환불 방법】\n• Apple App Store: reportaproblem.apple.com에서 직접 신청\n• Google Play: 구매 후 48시간 이내 Play Store에서 직접 환불 가능. 48시간 경과 시 Google 고객센터를 통해 문의\n• 웹 결제(토스페이먼츠): 고객센터(hermosear98@gmail.com)로 직접 신청\n\n【예외: 상품 하자】\n설명과 다르거나 기술적 결함이 있는 상품은 사용 여부와 관계없이 환불 가능합니다. 스크린샷과 함께 고객센터로 문의해 주세요.\n\n무료 프로모션 또는 이벤트로 지급받은 에셋은 환불 대상이 아닙니다.\n\n환불 처리 시 해당 에셋의 사용자격은 즉시 회수됩니다.'
    },
    {
      id: '12',
      category: 'return',
      question: 'Apple App Store(iOS)에서 결제한 디지털 콘텐츠 환불은 어떻게 하나요?',
      answer: 'Apple의 정책에 따라 개발사(Handy)가 직접 환불을 처리할 수 없습니다. 모든 환불 요청은 Apple에 직접 접수해 주셔야 합니다.\n\n【환불 신청 방법】\n• reportaproblem.apple.com 접속 → 해당 구매 항목 선택 → 환불 사유 선택\n• 또는 기기의 설정 → Apple ID → 미디어 및 구입 항목 → 지출 내역에서 신청\n\n구매일로부터 90일 이내에 신청 가능하며, 승인 여부는 Apple이 심사하여 결정합니다.'
    },
    {
      id: '13',
      category: 'return',
      question: 'Google Play Store(Android)에서 결제한 디지털 콘텐츠 환불은 어떻게 하나요?',
      answer: '【결제 후 48시간 이내】\nGoogle Play Store → 결제 및 구독 → 주문에서 직접 환불을 요청하실 수 있습니다.\n\n【결제 후 48시간 경과】\nGoogle Play 고객센터를 통해 환불을 요청해 주세요. 승인 여부는 Google이 심사하여 결정합니다.'
    },
    {
      id: '14',
      category: 'return',
      question: '디지털 콘텐츠 환불이 불가능한 경우는 어떤 경우인가요?',
      answer: '앱 스토어(Apple, Google) 결제 건은 해당 스토어의 환불 정책을 따르며, 아래 사항은 웹 결제(토스페이먼츠) 및 당사 직접 환불 처리 시 적용됩니다.\n\n다음의 경우 환불이 제한됩니다:\n1. 구독 상품: 결제 후 Pro 전용 기능을 1회 이상 사용했거나 결제일로부터 7일이 경과한 경우\n2. 단건 구매 상품: 에셋을 캔버스에 1회 이상 적용했거나 결제일로부터 7일이 경과한 경우\n3. 사용자의 귀책사유(이용약관 위반 등)로 인해 계정이 이용 제한되거나 강제 탈퇴 처리된 경우\n4. 부정 사용이 확인된 경우\n5. 무료 프로모션 또는 이벤트를 통해 지급받은 콘텐츠\n\n이용자의 거주 국가 법령에 따라 본 정책보다 유리한 소비자 보호 규정이 있는 경우 해당 법령이 우선 적용될 수 있습니다.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageLayout title="자주 묻는 질문" onBack={() => onGo("/")}>
      <div className="space-y-6">
        {/* 검색창 */}
        <div className="bg-white rounded-lg p-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="궁금한 내용을 검색해보세요"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ 리스트 */}
        <div className="space-y-2">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🤔</div>
              <div className="text-gray-600">
                {searchQuery ? '검색 결과가 없습니다.' : '해당 카테고리에 FAQ가 없습니다.'}
              </div>
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg border overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-brand-50 text-brand rounded-full text-xs font-medium flex items-center justify-center">
                        Q
                      </span>
                      <span className="font-medium pr-4">{faq.question}</span>
                    </div>
                    <span className={`transform transition-transform text-gray-400 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}>
                      ▼
                    </span>
                  </div>
                </button>
                
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-medium flex items-center justify-center">
                        A
                      </span>
                      <div className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 추가 도움말 */}
        <div className="bg-brand-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">찾으시는 답변이 없으신가요?</h3>
          <p className="text-sm text-gray-600 mb-3">
            더 자세한 도움이 필요하시면 고객센터로 문의해 주세요.
          </p>
          <button
            onClick={() => onGo('/contact')}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            1:1 문의하기
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

// About HANDY - 회사 소개
export function AboutCompanyPageSimple({ onGo }: { onGo: (to: string) => void }) {
  return (
    <PageLayout title="회사 소개" onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">HANDY</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            핸디는 네일아트의 새로운 기준을 제시하며, 모든 사람이 손쉽게 아름다운 네일을 완성할 수 있도록 돕는 브랜드입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">우리의 미션</h3>
            <p className="text-sm text-gray-600">
              누구나 쉽고 빠르게 전문가 수준의 네일아트를 완성할 수 있는 세상을 만듭니다.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">우리의 비전</h3>
            <p className="text-sm text-gray-600">
              네일아트 분야의 글로벌 리더로서 혁신적인 제품과 서비스를 제공합니다.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">회사 연혁</h3>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="text-sm font-medium text-brand min-w-[80px]">2024</div>
              <div className="text-sm">핸디 브랜드 론칭, 첫 제품 출시</div>
            </div>
            <div className="flex gap-4">
              <div className="text-sm font-medium text-brand min-w-[80px]">2023</div>
              <div className="text-sm">에르모세아르 설립</div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// About HANDY - 비즈니스 소개
export function AboutBusinessPageSimple({ onGo }: { onGo: (to: string) => void }) {
  return (
    <PageLayout title="비즈니스 소개" onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">사업 영역</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">제품 개발</h3>
              <p className="text-sm text-gray-600">네일팁, 젤, 도구 등 네일아트 관련 제품 개발</p>
            </div>
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">온라인 플랫폼</h3>
              <p className="text-sm text-gray-600">모바일 앱과 웹을 통한 직접 판매</p>
            </div>
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">파트너십</h3>
              <p className="text-sm text-gray-600">미용실, 네일샵과의 B2B 협력</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// About HANDY - 뉴스룸
export function AboutNewsroomPageSimple({ onGo }: { onGo: (to: string) => void }) {
  const news = [
    { date: "2024-08-15", title: "핸디 플러스 멤버십 서비스 출시", category: "서비스" },
    { date: "2024-08-01", title: "여름 시즌 신제품 컬렉션 론칭", category: "제품" },
    { date: "2024-07-20", title: "네일아트 교육 프로그램 시작", category: "교육" },
  ];

  return (
    <PageLayout title="뉴스룸" onBack={() => onGo("/")}>
      <div className="space-y-4">
        {news.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs bg-brand-50 text-brand px-2 py-1 rounded">{item.category}</span>
              <span className="text-xs text-gray-500">{item.date}</span>
            </div>
            <h3 className="font-medium">{item.title}</h3>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

// About HANDY - 채용 정보
export function AboutCareersPageSimple({ onGo }: { onGo: (to: string) => void }) {
  const positions = [
    { title: "프론트엔드 개발자", department: "개발팀", type: "정규직", location: "경기도 용인" },
    { title: "제품 기획자", department: "기획팀", type: "정규직", location: "경기도 용인" },
    { title: "마케팅 매니저", department: "마케팅팀", type: "계약직", location: "경기도 용인" },
  ];

  return (
    <PageLayout title="채용 정보" onBack={() => onGo("/")}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">함께 성장할 동료를 찾습니다</h2>
          <p className="text-gray-600 mb-6">
            핸디와 함께 네일아트 산업의 혁신을 만들어갈 열정적인 인재를 모집합니다.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">채용 중인 포지션</h3>
          {positions.map((pos, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{pos.title}</h4>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{pos.type}</span>
              </div>
              <div className="text-sm text-gray-600">
                {pos.department} • {pos.location}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

// About HANDY - 공지사항
export function AboutNoticePageSimple({ onGo }: { onGo: (to: string) => void }) {
  const notices = [
    { date: "2024-08-18", title: "추석 연휴 배송 및 고객센터 운영 안내", important: true },
    { date: "2024-08-15", title: "개인정보처리방침 개정 안내", important: false },
    { date: "2024-08-10", title: "여름휴가 기간 배송 지연 안내", important: false },
  ];

  return (
    <PageLayout title="공지사항" onBack={() => onGo("/")}>
      <div className="space-y-3">
        {notices.map((notice, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-1">
              {notice.important && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">중요</span>
              )}
              <span className="text-xs text-gray-500">{notice.date}</span>
            </div>
            <h3 className="font-medium">{notice.title}</h3>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}