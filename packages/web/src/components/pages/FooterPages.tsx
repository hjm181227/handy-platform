// 공통 컴포넌트
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

// 회사 소개 관련 페이지들
export function AboutCompanyPage({ onGo }: { onGo: (to: string) => void }) {
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

export function AboutBusinessPage({ onGo }: { onGo: (to: string) => void }) {
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

export function AboutNewsroomPage({ onGo }: { onGo: (to: string) => void }) {
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

export function AboutCareersPage({ onGo }: { onGo: (to: string) => void }) {
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

export function AboutNoticePage({ onGo }: { onGo: (to: string) => void }) {
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

// 파트너 지원 페이지들
export function PartnerInquiryPage({ onGo, type }: { onGo: (to: string) => void; type: string }) {
  const titles: { [key: string]: string } = {
    "입점 문의": "입점 문의",
    "광고/제휴 문의": "광고/제휴 문의",
    "협찬 문의": "협찬 문의",
    "공동/대량 구매 문의": "공동/대량 구매 문의",
    "제조/생산 문의": "제조/생산 문의",
    "이미지/저작권 문의": "이미지/저작권 문의"
  };

  return (
    <PageLayout title={titles[type] || "파트너 문의"} onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">회사명</label>
            <input type="text" className="w-full p-2 border rounded-lg" placeholder="회사명을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">담당자명</label>
            <input type="text" className="w-full p-2 border rounded-lg" placeholder="담당자명을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">연락처</label>
            <input type="tel" className="w-full p-2 border rounded-lg" placeholder="연락처를 입력하세요" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input type="email" className="w-full p-2 border rounded-lg" placeholder="이메일을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">문의 내용</label>
            <textarea 
              className="w-full p-2 border rounded-lg h-32 resize-none" 
              placeholder="구체적인 문의 내용을 작성해 주세요"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            onClick={(e) => {
              e.preventDefault();
              alert("문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.");
            }}
          >
            문의 접수
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

// 정책 페이지들
export function PolicyPage({ onGo, type }: { onGo: (to: string) => void; type: string }) {
  const contents: { [key: string]: { title: string; content: string } } = {
    privacy: {
      title: "개인정보처리방침",
      content: `
1. 개인정보의 처리 목적
에르모세아르('핸디')는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
- 고객 가입의사 확인, 고객에 대한 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리
- 물품 또는 서비스 공급에 따른 금액 결제, 물품 또는 서비스의 공급·배송 등

2. 개인정보의 처리 및 보유 기간
① 에르모세아르는 정보주체로부터 개인정보를 수집할 때 동의받은 개인정보 보유·이용기간 또는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

3. 개인정보의 제3자 제공
① 에르모세아르는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
      `
    },
    terms: {
      title: "이용약관",
      content: `
제1조 (목적)
이 약관은 에르모세아르(전자상거래 사업자)가 운영하는 핸디 쇼핑몰(이하 "몰"이라 한다)에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 사이버 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "몰"이란 에르모세아르가 재화 또는 용역(이하 "재화 등"이라 함)을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 사이버몰을 운영하는 사업자의 의미로도 사용합니다.
      `
    },
    pg: {
      title: "결제대행 위탁사",
      content: `
핸디는 안전하고 편리한 결제 서비스 제공을 위해 다음의 결제대행업체에 결제를 위탁하고 있습니다.

1. 토스페이먼츠
- 위탁업무: 신용카드, 체크카드, 간편결제 처리
- 보유기간: 거래완료 후 5년

2. 카카오페이
- 위탁업무: 카카오페이 간편결제 처리
- 보유기간: 거래완료 후 5년

3. 네이버페이
- 위탁업무: 네이버페이 간편결제 처리
- 보유기간: 거래완료 후 5년
      `
    },
    dispute: {
      title: "분쟁해결기준",
      content: `
제1조 (목적)
이 기준은 전자상거래 등에서의 소비자보호에 관한 법률 제32조에 따라 핸디에서 발생하는 분쟁을 신속하고 공정하게 처리하기 위한 기준을 정함을 목적으로 합니다.

제2조 (반품/교환)
1. 상품 수령 후 7일 이내 반품/교환 신청 가능
2. 단순 변심의 경우 왕복 배송비 고객 부담
3. 상품 하자의 경우 무료 반품/교환

제3조 (환불)
1. 카드결제: 승인취소 (2-3영업일)
2. 계좌이체: 계좌입금 (3-5영업일)
3. 간편결제: 각 결제사 정책에 따름
      `
    },
    cctv: {
      title: "영상정보처리기기 운영·관리방침",
      content: `
에르모세아르는 「개인정보 보호법」 제25조에 따라 다음과 같이 영상정보처리기기를 운영·관리합니다.

1. 영상정보처리기기의 설치근거 및 목적
- 설치근거: 개인정보보호법 제25조
- 설치목적: 시설안전 및 화재예방, 도난방지

2. 설치 대수, 설치 위치, 촬영 범위
- 설치대수: 5대
- 설치위치: 사무실 출입구, 창고
- 촬영범위: 출입통로 및 작업공간

3. 관리책임자
- 성명: 김동현 (대표)
- 연락처: 070-0000-0000
      `
    }
  };

  const policy = contents[type] || { title: "정책", content: "해당 정책을 찾을 수 없습니다." };

  return (
    <PageLayout title={policy.title} onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {policy.content}
          </pre>
        </div>
      </div>
    </PageLayout>
  );
}

// SNS 페이지들
export function SnsPage({ onGo, platform }: { onGo: (to: string) => void; platform: string }) {
  const platforms: { [key: string]: { name: string; handle: string; description: string } } = {
    yt: { name: "YouTube", handle: "@HandyOfficial", description: "네일아트 튜토리얼과 제품 리뷰를 만나보세요" },
    ig: { name: "Instagram", handle: "@handy_official", description: "매일 업데이트되는 네일아트 인스피레이션" },
    x: { name: "X (Twitter)", handle: "@HandyOfficial", description: "핸디의 최신 소식과 이벤트 정보" },
    tiktok: { name: "TikTok", handle: "@handy_official", description: "짧고 재미있는 네일아트 영상" },
    blog: { name: "Blog", handle: "handy.blog.com", description: "상세한 네일아트 가이드와 팁" }
  };

  const info = platforms[platform] || { name: "SNS", handle: "", description: "" };

  return (
    <PageLayout title={info.name} onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
            {info.name.substring(0, 2)}
          </div>
          <h2 className="text-xl font-bold mb-2">{info.handle}</h2>
          <p className="text-gray-600">{info.description}</p>
        </div>
        
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">
          팔로우하기
        </button>
        
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">1.2K</div>
            <div className="text-sm text-gray-600">팔로워</div>
          </div>
          <div>
            <div className="text-2xl font-bold">89</div>
            <div className="text-sm text-gray-600">게시물</div>
          </div>
          <div>
            <div className="text-2xl font-bold">4.5K</div>
            <div className="text-sm text-gray-600">좋아요</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// 1:1 문의하기 페이지
export function ContactInquiryPage({ onGo }: { onGo: (to: string) => void }) {
  const [inquiryType, setInquiryType] = React.useState('product');
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [content, setContent] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);

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
    setAttachments([]);
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

          {/* 파일 첨부 */}
          <div>
            <label className="block text-sm font-medium mb-2">파일 첨부</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(Array.from(e.target.files));
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-gray-500">
                  <div className="text-2xl mb-2">📎</div>
                  <div className="text-sm">
                    클릭하여 파일을 선택하세요
                    <br />
                    <span className="text-xs text-gray-400">
                      (이미지, PDF, 문서 파일 / 최대 5MB)
                    </span>
                  </div>
                </div>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-500 ml-2">{Math.round(file.size / 1024)}KB</span>
                  </div>
                ))}
              </div>
            )}
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
export function FaqPage({ onGo }: { onGo: (to: string) => void }) {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

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
            filteredFaqs.map((faq, index) => (
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
            onClick={() => onGo('/contact')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            1:1 문의하기
          </button>
        </div>
      </div>
    </PageLayout>
  );
}