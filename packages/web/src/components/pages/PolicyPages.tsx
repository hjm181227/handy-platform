import React from 'react';

// 공통 레이아웃 컴포넌트
const PolicyLayout = ({ 
  title, 
  onClose, 
  children 
}: { 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode; 
}) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  </div>
);

// 이용약관 컴포넌트
export function TermsOfService({ onClose }: { onClose: () => void }) {
  return (
    <PolicyLayout title="서비스 이용약관" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3">제1조(목적)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이 약관은 에르모세아르(전자상거래 사업자)가 운영하는 핸디(이하 "홈페이지"라 한다) 및 모바일 어플리케이션에서 제공하는 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 홈페이지와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
            <p>2. PC통신, 무선 등을 이용하는 전자상거래에 대해서도 그 성질에 반하지 않는 한 이 약관을 준용합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제2조(정의)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "회사"란 에르모세아르가 재화 또는 용역(이하 "재화 등"이라 함)을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 홈페이지를 운영하는 사업자의 의미로도 사용합니다.</p>
            <p>2. "이용자"란 "회사"에 접속하여 이 약관에 따라 "회사"가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
            <p>3. "회원"이라 함은 "회사"에 회원등록을 한 자로서, 계속적으로 "회사"가 제공하는 서비스를 이용할 수 있는 자를 말합니다.</p>
            <p>4. "비회원"이라 함은 회원에 가입하지 않고 "회사"가 제공하는 서비스를 이용하는 자를 말합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제3조(약관 등의 명시와 설명 및 개정)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "회사"는 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소(소비자의 불만을 처리할 수 있는 곳의 주소를 포함), 전화번호·모사전송번호·전자우편주소, 사업자등록번호, 통신판매업 신고번호, 개인정보관리 책임자등을 이용자가 쉽게 알 수 있도록 "서비스"의 초기화면(전면)에 게시합니다.</p>
            <p>2. "회사"는 이용자가 약관에 동의하기에 앞서 약관에 정하여져 있는 내용 중 청약철회·배송책임·환불조건 등과 같은 중요한 내용을 이용자가 이해할 수 있도록 별도의 연결화면 또는 팝업화면 등을 제공하여 이용자의 확인을 구하여야 합니다.</p>
            <p>3. "회사"는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「전자문서 및 전자거래기본법」, 「전자금융거래법」, 「전자서명법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「방문판매 등에 관한 법률」, 「소비자기본법」 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제6조(회원가입)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 "회사"가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
            <p>2. "회사"는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 가입신청자가 이 약관 제7조에 의하여 이전에 회원자격을 상실한 적이 있는 경우</p>
              <p>나. 등록 내용에 허위, 기재누락, 오기가 있는 경우</p>
              <p>다. 기타 회원으로 등록하는 것이 "회사"의 기술상 현저히 지장이 있다고 판단되는 경우</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제11조(지급방법)</h3>
          <div className="space-y-2 text-gray-700">
            <p>"회사"에서 구매한 재화 또는 용역에 대한 대금지급방법은 다음 각 호의 방법 중 가용한 방법으로 할 수 있습니다.</p>
            <div className="ml-4 space-y-1">
              <p>1. 선불카드, 직불카드, 신용카드 등의 각종 카드 결제</p>
              <p>2. 온라인무통장입금</p>
              <p>3. 수령 시 대금지급</p>
              <p>4. 기타 전자적 지급 방법에 의한 대금 지급 등</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제15조(청약철회 등)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "회사"과 재화등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날부터 7일 이내에는 청약의 철회를 할 수 있습니다.</p>
            <p>2. 이용자는 재화 등을 배송 받은 경우 다음 각 호의 1에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 이용자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우</p>
              <p>나. 이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우</p>
              <p>다. 시간의 경과에 의하여 재판매가 곤란할 정도로 재화등의 가치가 현저히 감소한 경우</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제17조(개인정보보호)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "회사"는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.</p>
            <p>2. "회사"는 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</p>
            <p>3. "회사"는 수집된 개인정보를 목적외의 용도로 이용할 수 없으며, 새로운 이용목적이 발생한 경우 또는 제3자에게 제공하는 경우에는 이용·제공단계에서 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">부칙</h3>
          <div className="text-gray-700">
            <p><strong>제1조(시행일)</strong></p>
            <p>본 약관은 2025.06.17. 부터 적용합니다.</p>
          </div>
        </section>
      </div>
    </PolicyLayout>
  );
}

// 개인정보처리방침 컴포넌트
export function PrivacyPolicy({ onClose }: { onClose: () => void }) {
  return (
    <PolicyLayout title="개인정보처리방침" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <div className="mb-4">
            <p className="text-gray-700">에르모세아르(이하 "회사")는 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호 등에 관한 법률", "개인정보보호법"을 준수하고 있습니다. 회사는 개인정보처리방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">1. 수집하는 개인정보 항목</h3>
          <div className="space-y-3 text-gray-700">
            <p>회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
            
            <div>
              <h4 className="font-medium mb-2">가. 필수항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>회원가입시: 이름, 아이디, 비밀번호, 이메일, 휴대전화번호</li>
                <li>서비스 이용시: 배송지 정보(받는사람 이름, 주소, 전화번호)</li>
                <li>결제시: 신용카드 정보, 은행계좌 정보 등 결제정보</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">나. 선택항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>생년월일, 성별, 관심분야, 마케팅 수신동의</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">다. 자동수집항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량이용기록 등</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">2. 개인정보의 수집 및 이용목적</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <h4 className="font-medium mb-2">가. 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</h4>
              <ul className="ml-4 list-disc">
                <li>컨텐츠 제공, 구매 및 요금 결제, 물품배송 또는 청구지 등 발송, 금융거래 본인 인증 및 금융 서비스</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">나. 회원 관리</h4>
              <ul className="ml-4 list-disc">
                <li>회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인, 만14세 미만 아동의 개인정보 수집 시 법정대리인 동의여부 확인, 불만처리 등 민원처리, 고지사항 전달</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">다. 마케팅 및 광고에 활용</h4>
              <ul className="ml-4 list-disc">
                <li>이벤트 등 광고성 정보 전달, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">3. 개인정보의 보유 및 이용기간</h3>
          <div className="space-y-2 text-gray-700">
            <p>회사는 개인정보 수집 및 이용목적이 달성된 후에는 예외 없이 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
            
            <div>
              <h4 className="font-medium mb-2">관련법령에 의한 정보보유 사유</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 보존</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 보존</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 보존</li>
                <li>로그인 기록: 3개월</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">10. 개인정보관리책임자 및 담당자의 연락처</h3>
          <div className="text-gray-700">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">개인정보관리책임자</h4>
              <ul className="space-y-1">
                <li>성명: 김민수</li>
                <li>소속: IT보안팀</li>
                <li>전화번호: 02-1234-5678</li>
                <li>이메일: privacy@handy-server.com</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">11. 고지의무</h3>
          <div className="space-y-2 text-gray-700">
            <p>현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일전부터 홈페이지의 '공지사항'을 통해 고지할 것입니다.</p>
            <ul className="mt-3 space-y-1">
              <li>• 개인정보처리방침 버전번호: v1.0</li>
              <li>• 개인정보처리방침 시행일자: 2025년 6월 17일</li>
              <li>• 개인정보처리방침 수정일자: 2025년 6월 17일</li>
            </ul>
          </div>
        </section>
      </div>
    </PolicyLayout>
  );
}

// 개인정보수집동의서 컴포넌트
export function PersonalDataConsent({ onClose }: { onClose: () => void }) {
  return (
    <PolicyLayout title="개인정보 수집 및 이용 동의서" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <div className="mb-4">
            <p className="text-gray-700">에르모세아르(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 개인정보 수집 및 이용에 대한 동의를 받고자 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">1. 개인정보의 수집 및 이용 목적</h3>
          <div className="text-gray-700">
            <ul className="ml-4 space-y-1 list-disc">
              <li>회원 가입 의사의 확인, 이용자 식별, 회원탈퇴 의사의 확인</li>
              <li>만 14세 미만 아동의 개인정보 수집 시 법정대리인의 동의여부 확인</li>
              <li>고지사항 전달, 불만처리 의사소통 경로의 확보</li>
              <li>새로운 서비스, 신상품이나 이벤트 정보 등의 안내</li>
              <li>마케팅 및 광고에 활용</li>
              <li>통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
              <li>민원처리 등을 위한 원활한 의사소통 경로의 확보</li>
              <li>불량회원의 부정 이용방지와 비인가 사용방지</li>
              <li>결제서비스 이용 시 매매의 이행, 배송, 대금의 결제</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">2. 수집하는 개인정보의 항목</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <h4 className="font-medium mb-2">가. 필수 수집항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>회원가입 시: 이름, 이메일 주소, 비밀번호, 휴대전화번호</li>
                <li>주문/배송 시: 주문자 정보, 수령자 정보(이름, 주소, 전화번호)</li>
                <li>결제 시: 신용카드 정보, 은행계좌 정보 등 결제 관련 정보</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">나. 선택 수집항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>생년월일, 성별, 관심분야</li>
                <li>마케팅 정보 수신 동의 여부</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">다. 서비스 이용 과정에서 자동 생성 수집항목</h4>
              <ul className="ml-4 space-y-1 list-disc">
                <li>IP 주소, 쿠키, MAC주소</li>
                <li>서비스 이용 기록, 접속 로그, 접속기기 정보</li>
                <li>방문 일시, 서비스 이용 기록, 불량 이용 기록</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">3. 개인정보의 보유 및 이용기간</h3>
          <div className="space-y-2 text-gray-700">
            <p>회원 가입일로부터 서비스를 제공하는 기간동안에 한하여 이용자의 개인정보를 보유 및 이용하게 됩니다.</p>
            <p>회원 탈퇴를 요청하거나 개인정보의 수집 및 이용에 대한 동의를 철회하는 경우에는 수집 및 이용목적이 달성되거나 보유 및 이용기간이 종료한 즉시 개인정보를 파기하는 것을 원칙으로 합니다.</p>
            
            <div className="mt-3">
              <p className="font-medium">관련 법령에 의한 보관기간:</p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 보관</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 보관</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 보관</li>
                <li>로그인 기록: 3개월</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">4. 개인정보 수집 및 이용 동의 거부</h3>
          <div className="space-y-2 text-gray-700">
            <p>이용자는 회사의 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다.</p>
            <p>회원 가입시 수집하는 최소한의 개인정보, 즉 필수 항목에 대한 수집 및 이용 동의를 거부하실 경우, 회원가입이 어려울 수 있습니다.</p>
          </div>
        </section>

        <section>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>※ 동의 거부 권리 안내</strong><br/>
              위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있으나, 동의 거부 시 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </div>
        </section>
      </div>
    </PolicyLayout>
  );
}