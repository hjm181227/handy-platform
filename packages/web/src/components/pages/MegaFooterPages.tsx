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
export function ContactInquiryPageSimple({ onGo }: { onGo: (to: string) => void }) {
  const [inquiryType, setInquiryType] = useState('product');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !subject || !content) {
      alert('필수 입력 항목을 모두 입력해주세요.');
      return;
    }
    
    alert('문의가 접수되었습니다. 24시간 이내에 답변드리겠습니다.');
    
    // 폼 초기화
    setEmail('');
    setSubject('');
    setContent('');
  };

  return (
    <PageLayout title="1:1 문의하기" onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">고객센터 문의</h2>
          <p className="text-gray-600 text-sm">
            궁금한 사항을 남겨주시면 빠르게 답변드리겠습니다. (평일 09:00~18:00 답변)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 유형 */}
          <div>
            <label className="block text-sm font-medium mb-2">문의 유형 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'product', label: '상품 문의' },
                { value: 'order', label: '주문/배송' },
                { value: 'payment', label: '결제 문의' },
                { value: 'return', label: '교환/환불' },
                { value: 'membership', label: '회원 정보' },
                { value: 'technical', label: '기술 지원' },
                { value: 'partnership', label: '제휴 문의' },
                { value: 'other', label: '기타' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInquiryType(type.value)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    inquiryType === type.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium mb-2">이메일 주소 <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="답변 받을 이메일을 입력하세요"
              required
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="문의 제목을 간단히 입력하세요"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium mb-2">문의 내용 <span className="text-red-500">*</span></label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40 resize-none"
              placeholder="문의 내용을 자세히 작성해주세요. 상품명, 주문번호 등을 함께 작성하시면 더 빠른 답변이 가능합니다."
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              최소 10자 이상 작성해주세요. ({content.length}/1000)
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-0.5" />
              <span>
                <strong>개인정보 수집 및 이용 동의 (필수)</strong>
                <div className="text-xs text-gray-600 mt-1">
                  문의 처리를 위해 이메일 주소와 문의 내용을 수집합니다. 
                  답변 완료 후 1년간 보관 후 삭제됩니다.
                </div>
              </span>
            </label>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            문의 접수하기
          </button>
        </form>

        {/* 연락처 정보 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">다른 연락 방법</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📞 고객센터: 1588-0000 (평일 09:00~18:00)</div>
            <div>📧 이메일: support@handy-platform.com</div>
            <div>💬 카카오톡: @handy_official</div>
          </div>
        </div>
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
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    ? 'bg-blue-600 text-white'
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
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center justify-center">
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
                      <div className="text-gray-600 leading-relaxed">{faq.answer}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 추가 도움말 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">찾으시는 답변이 없으신가요?</h3>
          <p className="text-sm text-gray-600 mb-3">
            더 자세한 도움이 필요하시면 고객센터로 문의해 주세요.
          </p>
          <button
            onClick={() => onGo('/contact-inquiry')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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
              <div className="text-sm font-medium text-blue-600 min-w-[80px]">2024</div>
              <div className="text-sm">핸디 브랜드 론칭, 첫 제품 출시</div>
            </div>
            <div className="flex gap-4">
              <div className="text-sm font-medium text-blue-600 min-w-[80px]">2023</div>
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
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{item.category}</span>
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