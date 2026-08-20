import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService, imageService } from '../../services/apiService';
import { User } from '@handy-platform/shared';
import { PageHeader } from '../layout/PageHeader';
import { RefreshCw } from 'lucide-react';

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
  const { t } = useTranslation('common');
  const [inquiries] = useState<Array<{
    id: number;
    title: string;
    category: string;
    status: string;
    date: string;
    content: string;
    answer: string | null;
  }>>([]);

  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInquiry, setNewInquiry] = useState({
    category: t('support.categoryProduct'),
    title: "",
    content: ""
  });

  const categories = [
    t('support.categoryProduct'),
    t('support.categoryShipping'),
    t('support.categoryReturnExchange'),
    t('support.categoryPayment'),
    t('support.categoryOther'),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('support.inquirySubmitted'));
    setShowNewInquiry(false);
    setNewInquiry({ category: t('support.categoryProduct'), title: "", content: "" });
  };

  if (showNewInquiry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader onBack={() => setShowNewInquiry(false)} title={t('support.contactWriteTitle')} />
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">{t('support.inquiryCategory')}</label>
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
            <label className="block text-sm font-medium mb-2">{t('support.inquiryTitle')}</label>
            <input
              type="text"
              value={newInquiry.title}
              onChange={(e) => setNewInquiry({...newInquiry, title: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder={t('support.inquiryTitlePlaceholder')}
              required
            />
          </div>

          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">{t('support.inquiryContent')}</label>
            <textarea
              value={newInquiry.content}
              onChange={(e) => setNewInquiry({...newInquiry, content: e.target.value})}
              className="w-full p-2 border rounded-lg h-32 resize-none"
              placeholder={t('support.inquiryContentPlaceholder')}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand-600"
          >
            {t('support.submitInquiry')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={t('support.contactTitle')} onBack={() => onGo("/my")} />

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{t('support.inquiryHistory')}</h3>
          <button
            onClick={() => setShowNewInquiry(true)}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-600"
          >
            {t('support.newInquiry')}
          </button>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-600 mb-1">{t('support.noInquiries')}</h3>
            <p className="text-sm text-gray-400">{t('support.noInquiriesHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map(inquiry => (
              <div key={inquiry.id} className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{inquiry.category}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      inquiry.status === t('support.answered') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
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
                    <div className="bg-brand-50 border-l-4 border-blue-400 p-3">
                      <div className="font-medium text-sm text-brand-600 mb-1">{t('support.answer')}</div>
                      <div className="text-sm text-brand">{inquiry.answer}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// FAQ 페이지
export function FaqPage({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('common');
  const [activeCategory, setActiveCategory] = useState('order');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    { id: 'order', label: t('support.faqCategoryOrder') },
    { id: 'return', label: t('support.faqCategoryReturn') },
    { id: 'payment', label: t('support.faqCategoryPayment') },
    { id: 'product', label: t('support.faqCategoryProduct') },
    { id: 'member', label: t('support.faqCategoryMember') },
  ];

  const faqs: Record<string, { id: number; question: string; answer: string }[]> = {
    order: [
      { id: 1, question: t('support.faq1Q'), answer: t('support.faq1A') },
      { id: 2, question: t('support.faq2Q'), answer: t('support.faq2A') },
      { id: 3, question: t('support.faq3Q'), answer: t('support.faq3A') },
    ],
    return: [
      { id: 4, question: t('support.faq4Q'), answer: t('support.faq4A') },
      { id: 5, question: t('support.faq5Q'), answer: t('support.faq5A') },
    ],
    payment: [
      { id: 6, question: t('support.faq6Q'), answer: t('support.faq6A') },
      { id: 7, question: t('support.faq7Q'), answer: t('support.faq7A') },
    ],
    product: [
      { id: 8, question: t('support.faq8Q'), answer: t('support.faq8A') },
      { id: 9, question: t('support.faq9Q'), answer: t('support.faq9A') },
    ],
    member: [
      { id: 10, question: t('support.faq10Q'), answer: t('support.faq10A') },
      { id: 11, question: t('support.faq11Q'), answer: t('support.faq11A') },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader onBack={() => onGo("/my")} title={t('support.faqTitle')} />

      {/* 카테고리 탭 */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto px-4 py-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 text-sm whitespace-nowrap ${
                activeCategory === category.id
                  ? 'text-black font-bold'
                  : 'text-gray-400'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="p-4 space-y-2">
        {faqs[activeCategory]?.map(faq => (
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
  const { t } = useTranslation('common');
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
          enabled ? 'bg-brand' : 'bg-gray-300'
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
      <PageHeader onBack={() => onGo("/my")} title={t('support.notificationTitle')} />

      <div className="p-4 space-y-4">
        <NotificationItem
          title={t('support.notifOrderUpdates')}
          description={t('support.notifOrderUpdatesDesc')}
          enabled={settings.orderUpdates}
          onToggle={() => handleToggle('orderUpdates')}
        />

        <NotificationItem
          title={t('support.notifPromotions')}
          description={t('support.notifPromotionsDesc')}
          enabled={settings.promotions}
          onToggle={() => handleToggle('promotions')}
        />

        <NotificationItem
          title={t('support.notifNewProducts')}
          description={t('support.notifNewProductsDesc')}
          enabled={settings.newProducts}
          onToggle={() => handleToggle('newProducts')}
        />

        <NotificationItem
          title={t('support.notifReviews')}
          description={t('support.notifReviewsDesc')}
          enabled={settings.reviews}
          onToggle={() => handleToggle('reviews')}
        />

        <NotificationItem
          title={t('support.notifMarketing')}
          description={t('support.notifMarketingDesc')}
          enabled={settings.marketing}
          onToggle={() => handleToggle('marketing')}
        />

        <div className="pt-4 border-t">
          <NotificationItem
            title={t('support.notifNightBlock')}
            description={t('support.notifNightBlockDesc')}
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
  const { t } = useTranslation('common');
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 타입 검증
    if (!file.type.startsWith('image/')) {
      alert(t('support.profileImageOnly'));
      return;
    }
    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      alert(t('support.profileImageSizeLimit'));
      return;
    }

    try {
      setAvatarUploading(true);

      // 1. presigned URL 발급
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'avatar',
      });

      // 2. S3에 업로드
      const uploadHeaders: Record<string, string> = { 'Content-Type': file.type };
      if ((presignedResponse as any).uploadHeaders) {
        Object.assign(uploadHeaders, (presignedResponse as any).uploadHeaders);
      }
      await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      // 3. 프로필에 avatar URL 저장
      const response = await webApiService.updateUserProfile({ avatar: presignedResponse.imageUrl } as Partial<User>);
      // 서버 응답: { success, data: { user }, message }
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUserInfo(prev => ({ ...prev, avatar: updatedUser.avatar || presignedResponse.imageUrl }));
      } else {
        setUserInfo(prev => ({ ...prev, avatar: presignedResponse.imageUrl }));
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert(t('support.profileImageFailed'));
    } finally {
      setAvatarUploading(false);
      // input 초기화 (같은 파일 재선택 가능하도록)
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // 페이지 로드 시 사용자 정보 불러오기
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const response = await webApiService.getCurrentUserProfile();
        console.log('🔍 사용자 프로필 API 응답:', response);

        const profileUser = response?.data?.user;
        if (profileUser) {
          const user = profileUser;
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

        let errorMessage = t('support.loadUserFailed');

        if (error.status === 401) {
          errorMessage = t('support.loginExpired');
        } else if (error.status === 403) {
          errorMessage = t('support.noPermission');
        } else if (error.status >= 500) {
          errorMessage = t('support.serverError');
        } else if (!navigator.onLine) {
          errorMessage = t('support.checkInternet');
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
      setNicknameError(t('support.nicknameRequired'));
      return;
    }

    if (nickname.length < 2 || nickname.length > 10) {
      setNicknameError(t('support.nicknameLength'));
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
        setNicknameError(t('support.nicknameTaken'));
      } else {
        setNicknameError(data.error?.message || t('support.nicknameCheckFailed'));
      }
    } catch (err) {
      console.error('닉네임 체크 실패:', err);
      setNicknameError(t('support.nicknameCheckError'));
    } finally {
      setNicknameCheckLoading(false);
    }
  };

  const handleSave = async () => {
    // 입력 검증
    if (!userInfo.name.trim()) {
      alert(t('support.nameRequired'));
      return;
    }

    // 닉네임 검증
    if (userInfo.nickname.trim()) {
      if (userInfo.nickname.length < 2 || userInfo.nickname.length > 10) {
        alert(t('support.nicknameLength'));
        return;
      }
      // 닉네임이 변경되었는데 중복 체크를 안 했으면
      if (userInfo.nickname !== originalNickname && (!nicknameChecked || !nicknameAvailable)) {
        alert(t('support.nicknameCheckRequired'));
        return;
      }
    }

    if (!userInfo.phone.trim()) {
      alert(t('support.phoneRequired'));
      return;
    }

    // 간단한 휴대폰 번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(userInfo.phone)) {
      alert(t('support.phoneFormat'));
      return;
    }

    // catch 블록에서도 참조하므로 try 밖에서 선언
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

    setLoading(true);
    try {
      // 실제 API 호출로 회원정보 수정
      const response = await webApiService.updateUserProfile(updateData);
      console.log('🔍 프로필 업데이트 API 응답:', response);

      // 서버 응답: { success, data: { user }, message }
      const user = response.data?.user;
      if (user) {
        // 서버에서 받은 최신 정보로 업데이트
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
      alert(t('support.updateSuccess'));
    } catch (error: any) {
      console.error('🚨 회원정보 수정 실패:', error);
      console.error('🚨 수정 시도 데이터:', updateData);
      console.error('🚨 에러 상세:', {
        status: error.status,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = t('support.updateFailed');

      if (error.status === 401) {
        errorMessage = t('support.loginExpired');
      } else if (error.status === 400) {
        errorMessage = error.message || t('support.checkInput');
      } else if (error.status === 403) {
        errorMessage = t('support.noEditPermission');
      } else if (error.status >= 500) {
        errorMessage = t('support.serverError');
      } else if (!navigator.onLine) {
        errorMessage = t('support.checkInternet');
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
        <PageHeader onBack={() => onGo("/my")} title={t('support.settingsTitle')} />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
            <p className="text-gray-500">{t('support.loadingUserInfo')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader onBack={() => onGo("/my")} title={t('support.settingsTitle')} />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-600"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader onBack={() => onGo("/my")} title={t('support.settingsTitle')} />

      <div className="p-4">
        {/* 사용자 요약 정보 */}
        <div className="bg-white rounded-lg border mb-4 p-4">
          <div className="flex items-center gap-4">
            {/* 아바타 + 업로드 버튼 */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="relative shrink-0"
            >
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt={t('support.profileImage')} className="w-16 h-16 rounded-full border object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
                  {(userInfo.nickname || userInfo.name || '?').charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand flex items-center justify-center border-2 border-white">
                {avatarUploading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 text-white" />
                )}
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{userInfo.name}</h2>
              <div className="text-sm text-gray-600">
                {userInfo.membershipLevel} {t('support.memberLevel')} • {t('support.pointLabel')}: {userInfo.points.toLocaleString()}P
              </div>
              <div className="text-xs text-gray-500">
                {t('support.totalOrders')}: {userInfo.totalOrders}{t('support.totalOrdersUnit')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{t('support.basicInfo')}</h3>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className="text-sm text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('support.saving') : isEditing ? t('save') : t('edit')}
            </button>
          </div>
          
          <div className="p-4">
            <InfoItem
              label={t('support.labelName')}
              value={userInfo.name}
              field="name"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            {/* 닉네임 필드 - 중복확인 버튼 포함 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="text-sm text-gray-600 min-w-[80px]">{t('support.labelNickname')}</div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={userInfo.nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      disabled={loading}
                      maxLength={10}
                      placeholder={t('support.nicknamePlaceholder')}
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
                      {nicknameCheckLoading ? t('support.nicknameChecking') : t('support.nicknameCheck')}
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
              label={t('support.labelEmail')}
              value={userInfo.email}
              field="email"
              editable={false}
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label={t('support.labelPhone')}
              value={userInfo.phone}
              field="phone"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label={t('support.labelBirthYear')}
              value={userInfo.birthYear}
              field="birthYear"
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label={t('support.labelGender')}
              value={userInfo.gender}
              field="gender"
              type="select"
              options={[t('support.genderMale'), t('support.genderFemale'), t('support.genderNone')]}
              isEditing={isEditing}
              loading={loading}
              onChange={handleInputChange}
            />
            <InfoItem
              label={t('support.labelAddress')}
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
            <h3 className="font-medium">{t('support.privacyConsent')}</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('support.marketingConsent')}</span>
              <button
                onClick={() => setUserInfo(prev => ({ ...prev, marketingConsent: !prev.marketingConsent }))}
                disabled={loading}
                className={`w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  userInfo.marketingConsent ? 'bg-brand' : 'bg-gray-300'
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
            <div className="font-medium">{t('support.changePassword')}</div>
            <div className="text-sm text-gray-600">{t('support.changePasswordDesc')}</div>
          </button>

          {userInfo.role !== 'seller' && (
            <button
              onClick={() => {
                if (confirm(t('support.switchToSellerConfirm'))) {
                  onGo("/seller/register");
                }
              }}
              className="w-full bg-white border border-brand/20 rounded-lg p-4 text-left hover:bg-brand-50"
            >
              <div className="font-medium text-brand">{t('support.switchToSeller')}</div>
              <div className="text-sm text-gray-600">{t('support.switchToSellerDesc')}</div>
            </button>
          )}

          <button
            onClick={async () => {
              const confirmMsg = t('support.deleteAccountConfirm', '정말로 계정을 삭제하시겠습니까?\n\n• 탈퇴 후 30일 내에 다시 로그인하면 계정을 복원할 수 있습니다.\n• 30일이 지나면 모든 데이터가 영구 삭제됩니다.');
              if (!confirm(confirmMsg)) return;
              try {
                if ((window as any).ReactNativeWebView) {
                  (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'DELETE_ACCOUNT',
                  }));
                } else {
                  await webApiService.deleteAccountAndClearToken();
                  window.dispatchEvent(new CustomEvent('authStateChanged'));
                  alert(t('support.deleteAccountSuccess', '탈퇴 요청이 접수되었습니다. 30일 내에 다시 로그인하시면 계정을 복원할 수 있습니다.'));
                  onGo('/login');
                }
              } catch (error: any) {
                const serverMsg = error?.data?.message || error?.message || '';
                const fallback = t('support.deleteAccountError', '계정 삭제에 실패했습니다. 다시 시도해주세요.');
                alert(serverMsg || fallback);
              }
            }}
            className="w-full bg-white border border-red-200 rounded-lg p-4 text-left hover:bg-red-50"
          >
            <div className="font-medium text-red-600">{t('support.deleteAccount')}</div>
            <div className="text-sm text-gray-600">{t('support.deleteAccountDesc')}</div>
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
          <button className="bg-white text-brand px-8 py-3 rounded-lg font-medium hover:bg-brand-50">
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