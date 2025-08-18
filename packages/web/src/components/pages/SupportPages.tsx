import { useState } from 'react';

// 공통 컴포넌트
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

// 1:1 문의 페이지
export function ContactPage({ onGo }: { onGo: (to: string) => void }) {
  const [inquiries] = useState([
    { 
      id: 1, 
      title: "배송 지연 문의", 
      category: "배송", 
      status: "답변완료", 
      date: "2024-08-15",
      content: "주문한 상품이 예정일보다 늦게 도착하는 것 같은데 언제 받을 수 있을까요?",
      answer: "안녕하세요. 배송이 지연되어 죄송합니다. 택배사 사정으로 인해 1일 지연되었으며, 내일(8/16) 오후에 수령 가능합니다."
    },
    { 
      id: 2, 
      title: "상품 불량 신고", 
      category: "상품", 
      status: "처리중", 
      date: "2024-08-14",
      content: "받은 네일팁에 균열이 있어서 교환 요청드립니다.",
      answer: null
    }
  ]);

  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInquiry, setNewInquiry] = useState({
    category: "상품",
    title: "",
    content: ""
  });

  const categories = ["상품", "배송", "교환/반품", "결제", "기타"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("문의가 등록되었습니다. 빠른 시일 내에 답변드리겠습니다.");
    setShowNewInquiry(false);
    setNewInquiry({ category: "상품", title: "", content: "" });
  };

  if (showNewInquiry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BackButton onBack={() => setShowNewInquiry(false)} title="1:1 문의 작성" />
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">문의 분류</label>
            <select 
              value={newInquiry.category}
              onChange={(e) => setNewInquiry({...newInquiry, category: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={newInquiry.title}
              onChange={(e) => setNewInquiry({...newInquiry, title: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="문의 제목을 입력하세요"
              required
            />
          </div>

          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">문의 내용</label>
            <textarea
              value={newInquiry.content}
              onChange={(e) => setNewInquiry({...newInquiry, content: e.target.value})}
              className="w-full p-2 border rounded-lg h-32 resize-none"
              placeholder="문의하실 내용을 자세히 작성해 주세요"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            문의 등록
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="1:1 문의" />
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">문의 내역</h3>
          <button 
            onClick={() => setShowNewInquiry(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            문의하기
          </button>
        </div>

        <div className="space-y-3">
          {inquiries.map(inquiry => (
            <div key={inquiry.id} className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{inquiry.category}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    inquiry.status === '답변완료' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {inquiry.status}
                  </span>
                </div>
                <div className="font-medium mb-1">{inquiry.title}</div>
                <div className="text-xs text-gray-500">{inquiry.date}</div>
              </div>
              
              <div className="p-4">
                <div className="text-sm text-gray-700 mb-3">{inquiry.content}</div>
                {inquiry.answer && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <div className="font-medium text-sm text-blue-800 mb-1">답변</div>
                    <div className="text-sm text-blue-700">{inquiry.answer}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FAQ 페이지
export function FaqPage({ onGo }: { onGo: (to: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("주문/배송");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = ["주문/배송", "교환/반품", "결제", "상품", "회원"];
  
  const faqs = {
    "주문/배송": [
      { id: 1, question: "배송료는 얼마인가요?", answer: "3만원 이상 무료배송이며, 미만 시 3,000원의 배송료가 부과됩니다." },
      { id: 2, question: "배송기간은 얼마나 걸리나요?", answer: "평일 기준 1-2일 소요되며, 주말/공휴일 제외입니다." },
      { id: 3, question: "주문 취소는 어떻게 하나요?", answer: "배송 전까지 마이페이지에서 취소 가능하며, 배송 후엔 반품으로 처리됩니다." },
    ],
    "교환/반품": [
      { id: 4, question: "교환/반품이 가능한 기간은?", answer: "상품 수령 후 7일 이내에 신청 가능합니다." },
      { id: 5, question: "교환/반품 비용은?", answer: "단순변심 시 고객 부담, 상품 불량 시 무료입니다." },
    ],
    "결제": [
      { id: 6, question: "어떤 결제 방법을 지원하나요?", answer: "신용카드, 체크카드, 간편결제(카카오페이, 네이버페이) 등을 지원합니다." },
      { id: 7, question: "포인트는 어떻게 적립되나요?", answer: "구매 금액의 1% 기본 적립되며, 등급별 추가 혜택이 있습니다." },
    ],
    "상품": [
      { id: 8, question: "네일팁 사이즈는 어떻게 선택하나요?", answer: "사이즈 가이드를 참고하시거나 사이즈 카드를 구매하여 측정해보세요." },
      { id: 9, question: "재입고 알림을 받을 수 있나요?", answer: "품절 상품 페이지에서 '재입고 알림' 버튼을 눌러 신청하시면 됩니다." },
    ],
    "회원": [
      { id: 10, question: "회원가입 혜택이 있나요?", answer: "신규회원 10% 할인쿠폰과 적립금 1,000원을 드립니다." },
      { id: 11, question: "비밀번호를 잊었어요", answer: "로그인 페이지의 '비밀번호 찾기'를 이용하시거나 고객센터로 문의하세요." },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="자주 묻는 질문" />
      
      {/* 카테고리 탭 */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto px-4 py-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm whitespace-nowrap ${
                activeCategory === category 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="p-4 space-y-2">
        {faqs[activeCategory as keyof typeof faqs]?.map(faq => (
          <div key={faq.id} className="bg-white rounded-lg border">
            <button
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <span className="font-medium">{faq.question}</span>
              <svg 
                className={`h-5 w-5 transform transition-transform ${
                  expandedFaq === faq.id ? 'rotate-180' : ''
                }`} 
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {expandedFaq === faq.id && (
              <div className="px-4 pb-4 text-sm text-gray-600 border-t bg-gray-50">
                <div className="pt-4">{faq.answer}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 알림/푸시 설정 페이지
export function NotificationsPage({ onGo }: { onGo: (to: string) => void }) {
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: false,
    reviews: true,
    marketing: false,
    nightMode: true, // 야간 알림 차단
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const NotificationItem = ({ 
    title, 
    description, 
    enabled, 
    onToggle 
  }: { 
    title: string; 
    description: string; 
    enabled: boolean; 
    onToggle: () => void;
  }) => (
    <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium mb-1">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="알림 설정" />
      
      <div className="p-4 space-y-4">
        <NotificationItem
          title="주문/배송 알림"
          description="주문 완료, 배송 시작, 배송 완료 알림"
          enabled={settings.orderUpdates}
          onToggle={() => handleToggle('orderUpdates')}
        />
        
        <NotificationItem
          title="프로모션 알림"
          description="할인, 쿠폰, 이벤트 정보 알림"
          enabled={settings.promotions}
          onToggle={() => handleToggle('promotions')}
        />
        
        <NotificationItem
          title="신상품 알림"
          description="새로운 상품 출시 알림"
          enabled={settings.newProducts}
          onToggle={() => handleToggle('newProducts')}
        />
        
        <NotificationItem
          title="리뷰 알림"
          description="리뷰 작성 요청 및 답글 알림"
          enabled={settings.reviews}
          onToggle={() => handleToggle('reviews')}
        />
        
        <NotificationItem
          title="마케팅 알림"
          description="맞춤형 상품 추천 및 광고 알림"
          enabled={settings.marketing}
          onToggle={() => handleToggle('marketing')}
        />
        
        <div className="pt-4 border-t">
          <NotificationItem
            title="야간 알림 차단"
            description="오후 10시~오전 8시 알림 차단"
            enabled={settings.nightMode}
            onToggle={() => handleToggle('nightMode')}
          />
        </div>
      </div>
    </div>
  );
}

// 회원정보 수정 페이지
export function SettingsPage({ onGo }: { onGo: (to: string) => void }) {
  const [userInfo, setUserInfo] = useState({
    nickname: "speed1",
    email: "speed1@example.com",
    phone: "010-1234-5678",
    birthYear: "1990",
    gender: "남성",
    address: "서울시 강남구 테헤란로 123",
    marketingConsent: true,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    alert("회원정보가 수정되었습니다.");
  };

  const InfoItem = ({ 
    label, 
    value, 
    editable = true, 
    type = "text",
    options 
  }: { 
    label: string; 
    value: string; 
    editable?: boolean; 
    type?: string;
    options?: string[];
  }) => (
    <div className="flex items-center justify-between py-3 border-b">
      <div className="text-sm text-gray-600 min-w-[80px]">{label}</div>
      {isEditing && editable ? (
        type === "select" && options ? (
          <select 
            value={value} 
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => setUserInfo(prev => ({ ...prev, [label.toLowerCase()]: e.target.value }))}
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            value={value} 
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => setUserInfo(prev => ({ ...prev, [label.toLowerCase()]: e.target.value }))}
          />
        )
      ) : (
        <div className="text-sm font-medium">{value}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="회원정보 수정" />
      
      <div className="p-4">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">기본 정보</h3>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isEditing ? "저장" : "수정"}
            </button>
          </div>
          
          <div className="p-4">
            <InfoItem label="닉네임" value={userInfo.nickname} />
            <InfoItem label="이메일" value={userInfo.email} editable={false} />
            <InfoItem label="연락처" value={userInfo.phone} />
            <InfoItem label="출생년도" value={userInfo.birthYear} />
            <InfoItem 
              label="성별" 
              value={userInfo.gender} 
              type="select" 
              options={["남성", "여성", "선택안함"]}
            />
            <InfoItem label="주소" value={userInfo.address} />
          </div>
        </div>

        <div className="bg-white rounded-lg border mt-4">
          <div className="p-4 border-b">
            <h3 className="font-medium">개인정보 동의</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">마케팅 정보 수신 동의</span>
              <button
                onClick={() => setUserInfo(prev => ({ ...prev, marketingConsent: !prev.marketingConsent }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  userInfo.marketingConsent ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  userInfo.marketingConsent ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button 
            onClick={() => alert("비밀번호 변경 페이지로 이동")}
            className="w-full bg-white border rounded-lg p-4 text-left hover:bg-gray-50"
          >
            <div className="font-medium">비밀번호 변경</div>
            <div className="text-sm text-gray-600">계정 보안을 위해 정기적으로 변경하세요</div>
          </button>
          
          <button 
            onClick={() => {
              if (confirm("정말 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제됩니다.")) {
                alert("탈퇴 처리가 완료되었습니다.");
              }
            }}
            className="w-full bg-white border border-red-200 rounded-lg p-4 text-left hover:bg-red-50"
          >
            <div className="font-medium text-red-600">회원 탈퇴</div>
            <div className="text-sm text-gray-600">탈퇴 시 모든 정보가 삭제됩니다</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// 프로모션 페이지 (핸디플러스)
export function PromoPage({ onGo }: { onGo: (to: string) => void }) {
  const benefits = [
    { icon: "🎁", title: "최대 10% 적립", description: "구매 금액의 최대 10%까지 포인트 적립" },
    { icon: "🚚", title: "무료배송", description: "주문 금액과 상관없이 항상 무료배송" },
    { icon: "⚡", title: "우선 배송", description: "일반 회원보다 1일 빠른 우선 배송" },
    { icon: "🎪", title: "독점 혜택", description: "멤버 전용 할인과 신상품 우선 구매" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="핸디플러스" />
      
      {/* 헤로 섹션 */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">HANDY+</div>
          <div className="text-blue-100 mb-4">프리미엄 멤버십</div>
          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <div className="text-sm opacity-90 mb-1">월 구독료</div>
            <div className="text-2xl font-bold">9,900원</div>
          </div>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50">
            멤버십 가입하기
          </button>
        </div>
      </div>

      {/* 혜택 소개 */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-4">멤버십 혜택</h3>
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="text-2xl">{benefit.icon}</div>
              <div>
                <div className="font-medium mb-1">{benefit.title}</div>
                <div className="text-sm text-gray-600">{benefit.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-4">자주 묻는 질문</h3>
          <div className="bg-white rounded-lg border p-4">
            <div className="font-medium mb-2">언제든 해지 가능한가요?</div>
            <div className="text-sm text-gray-600">네, 언제든 해지하실 수 있으며 해지 즉시 혜택이 종료됩니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}