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
          <h3 className="text-lg font-semibold mb-3">제1조(목적)</h3>
          <div className="text-gray-700">
            <p>에르모세아르(이하 '회사'라고 함)는 회사가 제공하고자 하는 서비스(이하 '회사 서비스')를 이용하는 개인(이하 '이용자' 또는 '개인')의 정보(이하 '개인정보')를 보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 '정보통신망법') 등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침(이하 '본 방침')을 수립합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제2조(개인정보 처리의 원칙)</h3>
          <div className="text-gray-700">
            <p>개인정보 관련 법령 및 본 방침에 따라 회사는 이용자의 개인정보를 수집할 수 있으며 수집된 개인정보는 개인의 동의가 있는 경우에 한해 제3자에게 제공될 수 있습니다. 단, 법령의 규정 등에 의해 적법하게 강제되는 경우 회사는 수집한 이용자의 개인정보를 사전에 개인의 동의 없이 제3자에게 제공할 수도 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제3조(본 방침의 공개)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 이용자가 언제든지 쉽게 본 방침을 확인할 수 있도록 회사 홈페이지 첫 화면 또는 첫 화면과의 연결 화면을 통해 본 방침을 공개하고 있습니다.</p>
            <p>2. 회사는 제1항에 따라 본 방침을 공개하는 경우 글자 크기, 색상 등을 활용하여 이용자가 본 방침을 쉽게 확인할 수 있도록 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제4조(본 방침의 변경)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 본 방침은 개인정보 관련 법령, 지침, 고시 또는 정부나 회사 서비스의 정책이나 내용의 변경에 따라 개정될 수 있습니다.</p>
            <p>2. 회사는 제1항에 따라 본 방침을 개정하는 경우 다음 각 호 하나 이상의 방법으로 공지합니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 회사가 운영하는 인터넷 홈페이지의 첫 화면의 공지사항란 또는 별도의 창을 통하여 공지하는 방법</p>
              <p>나. 서면•모사전송•전자우편 또는 이와 비슷한 방법으로 이용자에게 공지하는 방법</p>
            </div>
            <p>3. 회사는 제2항의 공지는 본 방침 개정의 시행일로부터 최소 7일 이전에 공지합니다. 다만, 이용자 권리의 중요한 변경이 있을 경우에는 최소 30일 전에 공지합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제5조(회원 가입을 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자의 회사 서비스에 대한 회원가입을 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-2">필수 수집 정보: 이메일 주소, 비밀번호, 이름, 닉네임, 생년월일 및 휴대폰 번호</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제6조(본인 인증을 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자의 본인인증을 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-2">필수 수집 정보: 휴대폰 번호, 이메일 주소, 이름, 생년월일, 성별, 이동통신사 및 내/외국인 여부</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제7조(결제 서비스를 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자에게 회사의 결제 서비스 제공을 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-2">필수 수집 정보: 카드번호, 카드비밀번호, 유효기간, 생년월일 6자리(yy/mm/dd), 은행명 및 계좌번호</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제8조(현금 영수증 발행을 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자의 현금영수증을 발행하기 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-2">필수 수집 정보: 현금영수증 발행 대상자 이름, 현금영수증 발행 대상자 생년월일, 현금영수증 발행 대상자 주소, 휴대폰 번호 및 현금영수증 카드번호</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제9조(회사 서비스 제공을 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자에게 회사의 서비스를 제공하기 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-2">필수 수집 정보: 아이디, 이메일 주소, 이름, 생년월일 및 연락처</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제10조(서비스 이용 및 부정 이용 확인을 위한 정보)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자의 서비스 이용에 따른 통계•분석 및 부정이용의 확인•분석을 위하여 다음과 같은 정보를 수집합니다. (부정이용이란 회원탈퇴 후 재가입, 상품구매 후 구매취소 등을 반복적으로 행하는 등 회사가 제공하는 할인쿠폰, 이벤트 혜택 등의 경제상 이익을 불•편법적으로 수취하는 행위, 이용약관 등에서 금지하고 있는 행위, 명의도용 등의 불•편법행위 등을 말합니다.)</p>
            <p className="mt-2">필수 수집 정보: 서비스 이용기록, 쿠키, 접속지 정보 및 기기정보</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제11조(개인정보 수집 방법)</h3>
          <div className="space-y-2 text-gray-700">
            <p>회사는 다음과 같은 방법으로 이용자의 개인정보를 수집합니다.</p>
            <div className="ml-4 space-y-1">
              <p>1. 이용자가 회사의 홈페이지에 자신의 개인정보를 입력하는 방식</p>
              <p>2. 어플리케이션 등 회사가 제공하는 홈페이지 외의 서비스를 통해 이용자가 자신의 개인정보를 입력하는 방식</p>
              <p>3. 이용자가 고객센터의 상담, 게시판에서의 활동 등 회사의 서비스를 이용하는 과정에서 이용자가 입력하는 방식</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제12조(개인정보의 이용)</h3>
          <div className="text-gray-700">
            <p>회사는 개인정보를 다음 각 호의 경우에 이용합니다.</p>
            <ul className="ml-4 mt-2 space-y-1 list-decimal">
              <li>공지사항의 전달 등 회사운영에 필요한 경우</li>
              <li>이용문의에 대한 회신, 불만의 처리 등 이용자에 대한 서비스 개선을 위한 경우</li>
              <li>회사의 서비스를 제공하기 위한 경우</li>
              <li>법령 및 회사 약관을 위반하는 회원에 대한 이용 제한 조치, 부정 이용 행위를 포함하여 서비스의 원활한 운영에 지장을 주는 행위에 대한 방지 및 제재를 위한 경우</li>
              <li>신규 서비스 개발을 위한 경우</li>
              <li>이벤트 및 행사 안내 등 마케팅을 위한 경우</li>
              <li>인구통계학적 분석, 서비스 방문 및 이용기록의 분석을 위한 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제13조(개인정보의 보유 및 이용기간)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 이용자의 개인정보에 대해 개인정보의 수집·이용 목적 달성을 위한 기간 동안 개인정보를 보유 및 이용합니다.</p>
            <p>2. 전항에도 불구하고 회사는 내부 방침에 의해 서비스 부정이용기록은 부정 가입 및 이용 방지를 위하여 회원 탈퇴 시점으로부터 최대 1년간 보관합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제14조(법령에 따른 개인정보의 보유 및 이용기간)</h3>
          <div className="text-gray-700">
            <p>회사는 관계법령에 따라 다음과 같이 개인정보를 보유 및 이용합니다.</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">1. 전자상거래 등에서의 소비자보호에 관한 법률에 따른 보유정보 및 보유기간</p>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>가. 계약 또는 청약철회 등에 관한 기록 : 5년</li>
                  <li>나. 대금결제 및 재화 등의 공급에 관한 기록 : 5년</li>
                  <li>다. 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년</li>
                  <li>라. 표시•광고에 관한 기록 : 6개월</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">2. 통신비밀보호법에 따른 보유정보 및 보유기간</p>
                <ul className="ml-4 mt-1">
                  <li>가. 웹사이트 로그 기록 자료 : 3개월</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">3. 전자금융거래법에 따른 보유정보 및 보유기간</p>
                <ul className="ml-4 mt-1">
                  <li>가. 전자금융거래에 관한 기록 : 5년</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">4. 위치정보의 보호 및 이용 등에 관한 법률</p>
                <ul className="ml-4 mt-1">
                  <li>가. 개인위치정보에 관한 기록 : 6개월</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제15조(개인정보의 파기원칙)</h3>
          <div className="text-gray-700">
            <p>회사는 원칙적으로 이용자의 개인정보 처리 목적의 달성, 보유•이용기간의 경과 등 개인정보가 필요하지 않을 경우에는 해당 정보를 지체 없이 파기합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제16조(개인정보파기절차)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자가 회원가입 등을 위해 입력한 정보는 개인정보 처리 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기 되어집니다.</p>
            <p>2. 회사는 파기 사유가 발생한 개인정보를 개인정보보호 책임자의 승인절차를 거쳐 파기합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제17조(개인정보파기방법)</h3>
          <div className="text-gray-700">
            <p>회사는 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이로 출력된 개인정보는 분쇄기로 분쇄하거나 소각 등을 통하여 파기합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제18조(광고성 정보의 전송 조치)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 이용자의 명시적인 사전동의를 받습니다. 다만, 다음 각호 어느 하나에 해당하는 경우에는 사전 동의를 받지 않습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 회사가 재화 등의 거래관계를 통하여 수신자로부터 직접 연락처를 수집한 경우, 거래가 종료된 날로부터 6개월 이내에 회사가 처리하고 수신자와 거래한 것과 동종의 재화 등에 대한 영리목적의 광고성 정보를 전송하려는 경우</p>
              <p>나. 「방문판매 등에 관한 법률」에 따른 전화권유판매자가 육성으로 수신자에게 개인정보의 수집출처를 고지하고 전화권유를 하는 경우</p>
            </div>
            <p>2. 회사는 전항에도 불구하고 수신자가 수신거부의사를 표시하거나 사전 동의를 철회한 경우에는 영리목적의 광고성 정보를 전송하지 않으며 수신거부 및 수신동의 철회에 대한 처리 결과를 알립니다.</p>
            <p>3. 회사는 오후 9시부터 그다음 날 오전 8시까지의 시간에 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우에는 제1항에도 불구하고 그 수신자로부터 별도의 사전 동의를 받습니다.</p>
            <p>4. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 다음의 사항 등을 광고성 정보에 구체적으로 밝힙니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 회사명 및 연락처</p>
              <p>나. 수신 거부 또는 수신 동의의 철회 의사표시에 관한 사항의 표시</p>
            </div>
            <p>5. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 다음 각 호의 어느 하나에 해당하는 조치를 하지 않습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 광고성 정보 수신자의 수신거부 또는 수신동의의 철회를 회피•방해하는 조치</p>
              <p>나. 숫자•부호 또는 문자를 조합하여 전화번호•전자우편주소 등 수신자의 연락처를 자동으로 만들어 내는 조치</p>
              <p>다. 영리목적의 광고성 정보를 전송할 목적으로 전화번호 또는 전자우편주소를 자동으로 등록하는 조치</p>
              <p>라. 광고성 정보 전송자의 신원이나 광고 전송 출처를 감추기 위한 각종 조치</p>
              <p>마. 영리목적의 광고성 정보를 전송할 목적으로 수신자를 기망하여 회신을 유도하는 각종 조치</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제19조(아동의 개인정보보호)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 만 14세 미만 아동의 개인정보 보호를 위하여 만 14세 이상의 이용자에 한하여 회원가입을 허용합니다.</p>
            <p>2. 제1항에도 불구하고 회사는 이용자가 만 14세 미만의 아동일 경우에는, 그 아동의 법정대리인으로부터 그 아동의 개인정보 수집, 이용, 제공 등의 동의를 그 아동의 법정대리인으로부터 받습니다.</p>
            <p>3. 제2항의 경우 회사는 그 법정대리인의 이름, 생년월일, 성별, 중복가입확인정보(ID), 휴대폰 번호 등을 추가로 수집합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제20조(개인정보 조회 및 수집동의 철회)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자 및 법정 대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 개인정보수집 동의 철회를 요청할 수 있습니다.</p>
            <p>2. 이용자 및 법정 대리인은 자신의 가입정보 수집 등에 대한 동의를 철회하기 위해서는 개인정보보호책임자 또는 담당자에게 서면, 전화 또는 전자우편주소로 연락하시면 회사는 지체 없이 조치하겠습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제21조(개인정보 정보변경 등)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 회사에게 전조의 방법을 통해 개인정보의 오류에 대한 정정을 요청할 수 있습니다.</p>
            <p>2. 회사는 전항의 경우에 개인정보의 정정을 완료하기 전까지 개인정보를 이용 또는 제공하지 않으며 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제22조(이용자의 의무)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 자신의 개인정보를 최신의 상태로 유지해야 하며, 이용자의 부정확한 정보 입력으로 발생하는 문제의 책임은 이용자 자신에게 있습니다.</p>
            <p>2. 타인의 개인정보를 도용한 회원가입의 경우 이용자 자격을 상실하거나 관련 개인정보보호 법령에 의해 처벌받을 수 있습니다.</p>
            <p>3. 이용자는 전자우편주소, 비밀번호 등에 대한 보안을 유지할 책임이 있으며 제3자에게 이를 양도하거나 대여할 수 없습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제23조(회사의 개인정보 관리)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 유출, 변조, 훼손 등이 되지 아니하도록 안전성을 확보하기 위하여 필요한 기술적•관리적 보호대책을 강구하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제24조(삭제된 정보의 처리)</h3>
          <div className="text-gray-700">
            <p>회사는 이용자 혹은 법정 대리인의 요청에 의해 해지 또는 삭제된 개인정보는 회사가 수집하는 "개인정보의 보유 및 이용기간"에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제25조(비밀번호의 암호화)</h3>
          <div className="text-gray-700">
            <p>이용자의 비밀번호는 일방향 암호화하여 저장 및 관리되고 있으며, 개인정보의 확인, 변경은 비밀번호를 알고 있는 본인에 의해서만 가능합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제26조(해킹 등에 대비한 대책)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 해킹, 컴퓨터 바이러스 등 정보통신망 침입에 의해 이용자의 개인정보가 유출되거나 훼손되는 것을 막기 위해 최선을 다하고 있습니다.</p>
            <p>2. 회사는 최신 백신프로그램을 이용하여 이용자들의 개인정보나 자료가 유출 또는 손상되지 않도록 방지하고 있습니다.</p>
            <p>3. 회사는 만일의 사태에 대비하여 침입차단 시스템을 이용하여 보안에 최선을 다하고 있습니다.</p>
            <p>4. 회사는 민감한 개인정보를 수집 및 보유하고 있는 경우 암호화 통신 등을 통하여 네트워크상에서 개인정보를 안전하게 전송할 수 있도록 하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제27조(개인정보 처리 최소화 및 교육)</h3>
          <div className="text-gray-700">
            <p>회사는 개인정보 관련 처리 담당자를 최소한으로 제한하며, 개인정보 처리자에 대한 교육 등 관리적 조치를 통해 법령 및 내부방침 등의 준수를 강조하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제28조(개인정보 유출 등에 대한 조치)</h3>
          <div className="text-gray-700">
            <p>회사는 개인정보의 분실•도난•유출(이하 "유출 등"이라 한다) 사실을 안 때에는 지체 없이 다음 각 호의 모든 사항을 해당 이용자에게 알리고 방송통신위원회 또는 한국인터넷진흥원에 신고합니다.</p>
            <ul className="ml-4 mt-2 space-y-1 list-decimal">
              <li>유출 등이 된 개인정보 항목</li>
              <li>유출 등이 발생한 시점</li>
              <li>이용자가 취할 수 있는 조치</li>
              <li>정보통신서비스 제공자 등의 대응 조치</li>
              <li>이용자가 상담 등을 접수할 수 있는 부서 및 연락처</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제29조(개인정보 유출 등에 대한 조치의 예외)</h3>
          <div className="text-gray-700">
            <p>회사는 전조에도 불구하고 이용자의 연락처를 알 수 없는 등 정당한 사유가 있는 경우에는 회사의 홈페이지에 30일 이상 게시하는 방법으로 전조의 통지를 갈음하는 조치를 취할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제30조(국외 이전 개인정보의 보호)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 이용자의 개인정보에 관하여 개인정보보호법 등 관계 법규를 위반하는 사항을 내용으로 하는 국제계약을 체결하지 않습니다.</p>
            <p>2. 회사는 이용자의 개인정보를 국외에 제공(조회되는 경우를 포함)•처리위탁•보관(이하 "이전"이라 함)하려면 이용자의 동의를 받습니다. 다만, 본조 제3항 각 호의 사항 모두를 개인정보보호법 등 관계 법규에 따라 공개하거나 전자우편 등 대통령령으로 정하는 방법에 따라 이용자에게 알린 경우에는 개인정보 처리위탁•보관에 따른 동의절차를 거치지 아니할 수 있습니다.</p>
            <p>3. 회사는 본조 제2항 본문에 따른 동의를 받으려면 미리 다음 각 호의 사항 모두를 이용자에게 고지합니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 이전되는 개인정보 항목</p>
              <p>나. 개인정보가 이전되는 국가, 이전일시 및 이전방법</p>
              <p>다. 개인정보를 이전받는 자의 성명(법인인 경우 그 명칭 및 정보관리 책임자의 연락처를 말한다)</p>
              <p>라. 개인정보를 이전받는 자의 개인정보 이용목적 및 보유•이용 기간</p>
            </div>
            <p>4. 회사는 본조 제2항 본문에 따른 동의를 받아 개인정보를 국외로 이전하는 경우 개인정보보호법 대통령령 등 관계법규에서 정하는 바에 따라 보호조치를 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제31조(개인정보 자동 수집 장치의 설치•운영 및 거부에 관한 사항)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 개인정보 자동 수집장치(이하 '쿠키')를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 웹브라우저(PC 및 모바일을 포함)에게 보내는 소량의 정보이며 이용자의 저장공간에 저장되기도 합니다.</p>
            <p>2. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
            <p>3. 다만, 쿠키의 저장을 거부할 경우에는 로그인이 필요한 회사의 일부 서비스는 이용에 어려움이 있을 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제32조(쿠키 설치 허용 지정 방법)</h3>
          <div className="text-gray-700">
            <p>웹브라우저 옵션 설정을 통해 쿠키 허용, 쿠키 차단 등의 설정을 할 수 있습니다.</p>
            <ul className="ml-4 mt-2 space-y-1 list-decimal">
              <li>Edge : 웹브라우저 우측 상단의 설정 메뉴 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트 데이터 관리 및 삭제</li>
              <li>Chrome : 웹브라우저 우측 상단의 설정 메뉴 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</li>
              <li>Whale : 웹브라우저 우측 상단의 설정 메뉴 &gt; 개인정보 보호 &gt; 쿠키 및 기타 사이트 데이터</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제33조(회사의 개인정보 보호 책임자 지정)</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. 회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호 책임자를 지정하고 있습니다.</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">가. 개인정보 보호 책임자</p>
              <ul className="ml-4 space-y-1">
                <li>성명: 김동현</li>
                <li>직책: CEO</li>
                <li>전화번호: 010-9611-1711</li>
                <li>이메일: jlionk200@gmail.com</li>
              </ul>
            </div>

            <p>2. 회사는 개인정보의 보호를 위해 개인정보보호 전담부서를 운영하고 있으며, 개인정보처리방침의 이행사항 및 담당자의 준수여부를 확인하여 문제가 발견될 경우 즉시 해결하고 바로 잡을 수 있도록 최선을 다하고 있습니다.</p>

            <p>3. 정보주체는 개인정보 보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다. 회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">가. 개인정보 보호 담당자</p>
              <ul className="ml-4 space-y-1">
                <li>담당부서: 개발팀</li>
                <li>담당자명: 허정민</li>
                <li>전화번호: 010-6469-0459</li>
                <li>이메일: heobusy@gmail.com</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제34조(권익침해에 대한 구제방법)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타 개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기 바랍니다.</p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>가. 개인정보분쟁조정위원회 : (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>나. 개인정보침해신고센터 : (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>다. 대검찰청 : (국번없이) 1301 (www.spo.go.kr)</li>
              <li>라. 경찰청 : (국번없이) 182 (ecrm.cyber.go.kr)</li>
            </ul>
            <p>2. 회사는 정보주체의 개인정보자기결정권을 보장하고, 개인정보침해로 인한 상담 및 피해 구제를 위해 노력하고 있으며, 신고나 상담이 필요한 경우 제1항의 담당부서로 연락해주시기 바랍니다.</p>
            <p>3. 개인정보 보호법 제35조(개인정보의 열람), 제36조(개인정보의 정정•삭제), 제37조(개인정보의 처리정지 등)의 규정에 의한 요구에 대하여 공공기관의 장이 행한 처분 또는 부작위로 인하여 권리 또는 이익의 침해를 받은 자는 행정심판법이 정하는 바에 따라 행정심판을 청구할 수 있습니다.</p>
            <p className="mt-2">중앙행정심판위원회 : (국번없이) 110 (www.simpan.go.kr)</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">부칙</h3>
          <div className="text-gray-700">
            <p><strong>제1조</strong> 본 방침은 2025.06.17. 부터 시행됩니다.</p>
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