import { useState, useCallback, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { User } from '@handy-platform/shared';
import { PageHeader } from '../layout/PageHeader';

// 정보 입력 항목 컴포넌트
const InfoItem = ({
  label,
  value,
  editable = true,
  type = "text",
  options,
  field,
  isEditing,
  loading,
  onChange
}: {
  label: string;
  value: string;
  editable?: boolean;
  type?: string;
  options?: string[];
  field: string;
  isEditing: boolean;
  loading: boolean;
  onChange: (field: string, value: string) => void;
}) => (
  <div className="flex items-center justify-between py-3 border-b">
    <div className="text-sm text-gray-600 min-w-[80px]">{label}</div>
    {isEditing && editable ? (
      type === "select" && options ? (
        <select
          value={value}
          disabled={loading}
          className="text-sm border rounded px-2 py-1 disabled:bg-gray-100"
          onChange={(e) => onChange(field, e.target.value)}
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          disabled={loading}
          className="text-sm border rounded px-2 py-1 disabled:bg-gray-100"
          onChange={(e) => onChange(field, e.target.value)}
        />
      )
    ) : (
      <div className="text-sm font-medium">{value}</div>
    )}
  </div>
);

// 공통 컴포넌트 - BackButton 제거 (PageHeader 사용)

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
        <PageHeader onBack={() => setShowNewInquiry(false)} title="1:1 문의 작성" />
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
      <PageHeader title="1:1 문의" onBack={() => onGo("/my")} />
      
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
      <PageHeader onBack={() => onGo("/my")} title="자주 묻는 질문" />
      
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
      <PageHeader onBack={() => onGo("/my")} title="알림 설정" />
      
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
    name: "",
    nickname: "",
    email: "",
    phone: "",
    birthYear: "",
    gender: "남성",
    address: "",
    marketingConsent: true,
    avatar: "",
    membershipLevel: "",
    points: 0,
    totalOrders: 0,
    joinedDate: "",
    role: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 닉네임 중복 체크 상태
  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [nicknameCheckLoading, setNicknameCheckLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState("");

  // 페이지 로드 시 사용자 정보 불러오기
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const response = await webApiService.getCurrentUserProfile();
        console.log('🔍 사용자 프로필 API 응답:', response);

        if (response.user) {
          const user = response.user;
          setUserInfo({
            name: user.name || "",
            nickname: user.nickname || "",
            email: user.email || "",
            phone: user.phone || "",
            birthYear: "", // API에서 제공하지 않는 필드
            gender: "남성", // API에서 제공하지 않는 필드
            address: user.address?.street || "",
            marketingConsent: true, // 기본값
            avatar: user.avatar || "",
            membershipLevel: user.membershipLevel || "",
            points: user.points?.balance || 0,
            totalOrders: user.stats?.totalOrders || 0,
            joinedDate: user.stats?.joinedDate || user.createdAt || "",
            role: user.role || "",
          });
          setOriginalNickname(user.nickname || "");
        }
      } catch (error: any) {
        console.error('🚨 사용자 정보 로드 실패:', error);
        console.error('🚨 에러 상세:', {
          status: error.status,
          message: error.message,
          stack: error.stack
        });

        let errorMessage = '사용자 정보를 불러오는데 실패했습니다.';

        if (error.status === 401) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.status === 403) {
          errorMessage = '접근 권한이 없습니다.';
        } else if (error.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (!navigator.onLine) {
          errorMessage = '인터넷 연결을 확인해주세요.';
        }

        setError(errorMessage);
      } finally {
        setInitialLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // 닉네임 변경 핸들러
  const handleNicknameChange = (value: string) => {
    setUserInfo(prev => ({ ...prev, nickname: value }));
    // 원래 닉네임과 다르면 중복 체크 필요
    if (value !== originalNickname) {
      setNicknameChecked(false);
      setNicknameAvailable(false);
      setNicknameError("");
    } else {
      // 원래 닉네임과 같으면 체크 불필요
      setNicknameChecked(true);
      setNicknameAvailable(true);
      setNicknameError("");
    }
  };

  // 닉네임 중복 체크
  const checkNickname = async () => {
    const nickname = userInfo.nickname.trim();

    if (!nickname) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }

    if (nickname.length < 2 || nickname.length > 10) {
      setNicknameError("닉네임은 2~10자여야 합니다.");
      return;
    }

    // 원래 닉네임과 같으면 체크 불필요
    if (nickname === originalNickname) {
      setNicknameChecked(true);
      setNicknameAvailable(true);
      setNicknameError("");
      return;
    }

    setNicknameCheckLoading(true);
    setNicknameError("");

    try {
      const response = await fetch(
        `/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`
      );
      const data = await response.json();

      if (data.success && data.available) {
        setNicknameChecked(true);
        setNicknameAvailable(true);
        setNicknameError("");
      } else if (data.success && !data.available) {
        setNicknameChecked(true);
        setNicknameAvailable(false);
        setNicknameError("이미 사용 중인 닉네임입니다.");
      } else {
        setNicknameError(data.error?.message || "닉네임 확인에 실패했습니다.");
      }
    } catch (err) {
      console.error('닉네임 체크 실패:', err);
      setNicknameError("닉네임 확인 중 오류가 발생했습니다.");
    } finally {
      setNicknameCheckLoading(false);
    }
  };

  const handleSave = async () => {
    // 입력 검증
    if (!userInfo.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    // 닉네임 검증
    if (userInfo.nickname.trim()) {
      if (userInfo.nickname.length < 2 || userInfo.nickname.length > 10) {
        alert("닉네임은 2~10자여야 합니다.");
        return;
      }
      // 닉네임이 변경되었는데 중복 체크를 안 했으면
      if (userInfo.nickname !== originalNickname && (!nicknameChecked || !nicknameAvailable)) {
        alert("닉네임 중복 확인을 해주세요.");
        return;
      }
    }

    if (!userInfo.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    // 간단한 휴대폰 번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(userInfo.phone)) {
      alert("연락처는 010-0000-0000 형식으로 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 실제 API 호출로 회원정보 수정
      const updateData: Partial<User> = {
        name: userInfo.name.trim(),
        nickname: userInfo.nickname.trim() || undefined,
        phone: userInfo.phone.trim(),
        address: userInfo.address ? {
          street: userInfo.address.trim(),
          city: "",
          state: "",
          zipCode: "",
          country: "KR"
        } : undefined
      };

      const response = await webApiService.updateUserProfile(updateData);
      console.log('🔍 프로필 업데이트 API 응답:', response);

      if (response.user) {
        // 서버에서 받은 최신 정보로 업데이트
        const user = response.user;
        setUserInfo(prev => ({
          ...prev,
          name: user.name || prev.name,
          nickname: user.nickname || prev.nickname,
          phone: user.phone || prev.phone,
          address: user.address?.street || prev.address,
          avatar: user.avatar || prev.avatar,
          membershipLevel: user.membershipLevel || prev.membershipLevel,
          points: user.points?.balance || prev.points,
          totalOrders: user.stats?.totalOrders || prev.totalOrders,
        }));
      }

      setIsEditing(false);
      setOriginalNickname(userInfo.nickname.trim());
      setNicknameChecked(false);
      alert("회원정보가 성공적으로 수정되었습니다.");
    } catch (error: any) {
      console.error('🚨 회원정보 수정 실패:', error);
      console.error('🚨 수정 시도 데이터:', updateData);
      console.error('🚨 에러 상세:', {
        status: error.status,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = "회원정보 수정에 실패했습니다. 다시 시도해주세요.";

      if (error.status === 401) {
        errorMessage = "로그인이 만료되었습니다. 다시 로그인해주세요.";
      } else if (error.status === 400) {
        errorMessage = error.message || "입력 정보를 확인해주세요.";
      } else if (error.status === 403) {
        errorMessage = "수정 권한이 없습니다.";
      } else if (error.status >= 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else if (!navigator.onLine) {
        errorMessage = "인터넷 연결을 확인해주세요.";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  // 초기 로딩 중
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader onBack={() => onGo("/my")} title="회원정보 수정" />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader onBack={() => onGo("/my")} title="회원정보 수정" />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader onBack={() => onGo("/my")} title="회원정보 수정" />

      <div className="p-4">
        {/* 사용자 요약 정보 */}
        {userInfo.avatar && (
          <div className="bg-white rounded-lg border mb-4 p-4">
            <div className="flex items-center gap-4">
              <img
                src={userInfo.avatar}
                alt="프로필 이미지"
                className="w-16 h-16 rounded-full border"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{userInfo.name}</h2>
                <div className="text-sm text-gray-600">
                  {userInfo.membershipLevel} 등급 • 포인트: {userInfo.points.toLocaleString()}P
                </div>
                <div className="text-xs text-gray-500">
                  총 주문: {userInfo.totalOrders}회
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">기본 정보</h3>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "저장 중..." : isEditing ? "저장" : "수정"}
            </button>
          </div>
          
          <div className="p-4">
            <InfoItem
              label="이름"
              value={userInfo.name}
              field="name"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            {/* 닉네임 필드 - 중복확인 버튼 포함 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="text-sm text-gray-600 min-w-[80px]">닉네임</div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={userInfo.nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      disabled={loading}
                      maxLength={10}
                      placeholder="2~10자"
                      className={`text-sm border rounded px-2 py-1 disabled:bg-gray-100 ${
                        nicknameChecked && nicknameAvailable ? 'border-green-500' : ''
                      } ${nicknameError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {userInfo.nickname !== originalNickname && (
                    <button
                      type="button"
                      onClick={checkNickname}
                      disabled={loading || nicknameCheckLoading || !userInfo.nickname.trim()}
                      className="px-2 py-1 rounded bg-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {nicknameCheckLoading ? "확인중" : "중복확인"}
                    </button>
                  )}
                  {nicknameChecked && nicknameAvailable && userInfo.nickname !== originalNickname && (
                    <span className="text-xs text-green-600 whitespace-nowrap">✓</span>
                  )}
                </div>
              ) : (
                <div className="text-sm font-medium">{userInfo.nickname || "-"}</div>
              )}
            </div>
            {isEditing && nicknameError && (
              <div className="text-xs text-red-500 text-right -mt-2 mb-2">{nicknameError}</div>
            )}
            <InfoItem
              label="이메일"
              value={userInfo.email}
              field="email"
              editable={false}
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label="연락처"
              value={userInfo.phone}
              field="phone"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label="출생년도"
              value={userInfo.birthYear}
              field="birthYear"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label="성별"
              value={userInfo.gender}
              field="gender"
              type="select"
              options={["남성", "여성", "선택안함"]}
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label="주소"
              value={userInfo.address}
              field="address"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
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
                disabled={loading}
                className={`w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
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

          {userInfo.role !== 'seller' && (
            <button
              onClick={() => {
                if (confirm("판매자로 전환하시겠습니까? 승인 후 상품 등록 및 판매가 가능합니다.")) {
                  onGo("/seller/register");
                }
              }}
              className="w-full bg-white border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-50"
            >
              <div className="font-medium text-blue-600">판매자 전환</div>
              <div className="text-sm text-gray-600">상품을 판매하고 수익을 창출하세요</div>
            </button>
          )}

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
      <PageHeader onBack={() => onGo("/my")} title="핸디플러스" />
      
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