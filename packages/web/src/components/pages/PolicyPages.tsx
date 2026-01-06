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
            <p>이 약관은 에르모세아르(이하 "회사")가 운영하는 "핸디(Handy)" 웹사이트 및 모바일 애플리케이션(이하 "서비스")을 통하여 제공하는 전자상거래 플랫폼 서비스의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항, 절차 등을 규정함을 목적으로 합니다.</p>
            <p>PC통신, 무선 등을 이용하는 전자상거래에 대해서도 그 성질에 반하지 않는 한 이 약관을 준용합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제2조(정의)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "서비스"란 회사가 운영하는 웹사이트 및 모바일 애플리케이션을 통하여 이용자에게 제공하는 전자상거래 플랫폼 및 관련 제반 서비스를 말합니다.</p>
            <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
            <p>3. "회원"이란 회사에 회원등록을 하고 이 약관에 따라 서비스를 계속 이용할 수 있는 자를 말합니다.</p>
            <p>4. "비회원"이란 회원으로 가입하지 않고 서비스를 이용하는 자를 말합니다.</p>
            <p>5. "판매자(입점 브랜드)"란 회사의 서비스에 입점하여 이용자에게 재화 또는 용역(이하 "재화 등")을 판매·제공하는 자를 말합니다.</p>
            <p>6. "통신판매중개"란 회사가 서비스 내에서 판매자와 이용자 간의 재화 등 거래가 이루어질 수 있도록 온라인 거래장소 및 관련 부가서비스를 제공하는 것을 말합니다.</p>
            <p>7. "구매"란 이용자가 서비스에서 재화 등을 선택하여 결제하는 행위를 말합니다.</p>
            <p>8. "커스텀 상품(주문제작/맞춤형)"이란 이용자의 요청에 따라 디자인·규격·구성·가격 등이 개별적으로 확정되거나, 결제 완료 즉시 제작(가공, 준비, 제작 지시 포함)이 착수되는 성질의 재화 등을 말합니다.</p>
            <p>9. "쿠폰"이란 회사 또는 판매자가 정한 정책에 따라 이용자에게 부여되는 할인권을 말하며, 쿠폰의 종류, 유효기간, 사용조건 등은 서비스 내 표시 또는 별도 운영정책에 따릅니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제3조(약관의 명시와 설명 및 개정)</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <p>1. 회사는 이 약관의 내용, 상호, 대표자 성명, 영업소 소재지 주소(소비자 불만처리 주소 포함), 전화번호, 전자우편주소, 사업자등록번호, 통신판매업 신고번호 등 관련 정보를 이용자가 쉽게 알 수 있도록 서비스 초기화면 또는 연결화면에 게시합니다.</p>
              <div className="ml-4 mt-2 bg-gray-50 p-3 rounded-lg text-sm">
                <p>- 상호: 에르모세아르</p>
                <p>- 대표자: 김동현</p>
                <p>- 주소: 경기도 용인시 기흥구 공세로 150-29, B01-G160호</p>
                <p>- 고객센터: 010-9611-1711, hermosear98@gmail.com</p>
                <p>- 사업자등록번호: 106-16-34319</p>
                <p>- 통신판매업 신고번호: 2024-용인기흥-2437</p>
              </div>
            </div>
            <p>2. 회사는 이용자가 약관에 동의하기 전에 청약철회(취소/환불/반품/교환), 배송, 커스텀 상품의 취소 제한 등 중요한 내용을 이용자가 이해할 수 있도록 서비스 내 별도 안내(연결화면, 팝업, 체크박스 등)를 제공합니다.</p>
            <p>3. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
            <p>4. 회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 적용일자 7일 전부터 공지합니다. 이용자에게 불리한 변경인 경우 최소 30일 이상의 사전 유예기간을 두고 공지하며, 개정 전후 내용을 비교하여 이용자가 알기 쉽게 표시합니다.</p>
            <p>5. 개정약관은 적용일자 이후 체결되는 거래에 적용됩니다. 다만, 이미 체결된 거래에 관하여 당사자 간 별도 합의가 있는 경우에는 그에 따릅니다.</p>
            <p>6. 이 약관에서 정하지 아니한 사항과 해석에 관하여는 관계 법령 및 상관례에 따릅니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제4조(서비스의 제공)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 다음과 같은 업무를 수행합니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 전자상거래 플랫폼(통신판매중개) 제공 및 이에 부수하는 서비스</p>
              <p>나. 재화 등 정보 제공, 검색·추천·정렬, 주문·결제·배송조회·고객문의 등 거래 편의 기능 제공</p>
              <p>다. 쿠폰 등 프로모션 기능 제공(해당 시)</p>
              <p>라. 기타 회사가 정하는 업무</p>
            </div>
            <p>2. 회사는 서비스 운영상 또는 기술상 필요에 따라 서비스의 내용, 제공방식, 제공시간 등을 변경할 수 있으며, 변경사항을 서비스 내 공지합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제5조(통신판매중개자 지위 및 거래당사자)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 통신판매중개자로서, 원칙적으로 이용자와 판매자 간 재화 등 거래의 당사자가 아닙니다. 재화 등 거래에 관한 계약은 특별한 사정이 없는 한 "이용자-판매자" 간에 성립합니다.</p>
            <p>2. 회사는 현재 서비스에서 재화 등을 직접 판매하지 않습니다. 향후 회사가 직접 판매자 지위로 재화 등을 판매하는 경우, 서비스 내에 명확히 표시하여 이용자가 거래당사자를 인지할 수 있도록 합니다.</p>
            <p>3. 회사는 통신판매중개자로서 거래의 안전성과 신뢰 확보를 위하여 필요한 범위에서 판매자 정보 제공, 상품정보 표시, 거래기록 보관, 분쟁 조정 지원 등 법령상 또는 서비스 정책상 요구되는 조치를 수행합니다.</p>
            <p>4. 회사는 판매자의 고의 또는 과실로 인한 재화 등의 하자, 배송 지연, 환불 거절 등으로 발생한 분쟁에 관하여, 법령상 또는 회사의 귀책사유가 있는 경우를 제외하고, 판매자에게 1차적 책임이 있음을 원칙으로 합니다. 다만 회사가 법령상 고지의무·정보제공의무 등을 위반한 경우에는 관계 법령에 따라 책임을 부담할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제6조(서비스의 중단)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 설비의 보수점검, 교체, 고장, 통신두절, 시스템 장애, 해킹 등 불가피한 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
            <p>2. 회사는 전항의 사유로 인하여 이용자에게 손해가 발생한 경우, 회사의 고의 또는 과실이 있는 범위 내에서 관계 법령에 따라 책임을 부담합니다.</p>
            <p>3. 회사가 사업종목 전환, 사업 포기, 업체 간 통합 등으로 서비스를 제공할 수 없게 되는 경우, 회사는 서비스 내 공지 등 적절한 방법으로 이용자에게 통지하고 관계 법령 및 서비스 정책에 따라 처리합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제7조(회원가입)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 회사가 정한 가입양식에 따라 회원정보를 기입하고 약관 및 개인정보처리방침에 동의함으로써 회원가입을 신청합니다.</p>
            <p>2. 회사는 다음 각 호에 해당하는 경우 승낙을 거절하거나 사후에 이용계약을 해지할 수 있습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 가입 신청 시 허위 내용, 기재누락, 오기가 있는 경우</p>
              <p>나. 타인의 정보를 도용한 경우</p>
              <p>다. 기타 회사의 기술상 현저한 지장이 있다고 판단되는 경우</p>
            </div>
            <p>3. 회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</p>
            <p>4. 회원은 가입 시 등록한 사항에 변경이 있는 경우 상당한 기간 내에 회원정보 수정 등의 방법으로 변경사항을 반영해야 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제8조(회원 탈퇴 및 이용제한)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회원은 언제든지 서비스 내 기능 또는 고객센터를 통해 탈퇴를 요청할 수 있으며, 회사는 관계 법령 및 개인정보처리방침에 따라 처리합니다.</p>
            <p>2. 회원이 다음 각 호에 해당하는 경우, 회사는 서비스 이용을 제한하거나 회원자격을 정지할 수 있습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 약관 또는 관계 법령 위반</p>
              <p>나. 결제수단 도용, 부정결제, 부정환불 등 부정행위</p>
              <p>다. 타인의 서비스 이용을 방해하거나 정보를 도용하는 행위</p>
              <p>라. 쿠폰의 부정 수취·사용 등 서비스 운영을 현저히 저해하는 행위</p>
            </div>
            <p>3. 회사는 이용제한 또는 회원자격 상실 조치 전에 사전 통지하고, 필요한 경우 소명기회를 부여할 수 있습니다. 다만, 긴급한 보안·사기 방지 필요가 있는 경우 사후 통지할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제9조(회원에 대한 통지)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사가 회원에게 통지하는 경우, 회원이 지정한 전자우편, 앱 푸시, 서비스 내 알림, 기타 합리적인 수단으로 통지할 수 있습니다.</p>
            <p>2. 불특정다수에 대한 통지는 서비스 내 공지사항에 7일 이상 게시함으로써 개별 통지에 갈음할 수 있습니다. 다만, 회원의 거래에 중대한 영향을 미치는 사항은 개별 통지를 원칙으로 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제10조(구매신청)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 서비스에서 다음 또는 이와 유사한 방법으로 구매를 신청합니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 재화 등 검색 및 선택</p>
              <p>나. 수령인 성명, 주소, 연락처 등 배송정보 입력</p>
              <p>다. 청약철회 제한 여부(커스텀/주문제작 등), 배송비 등 비용부담 확인</p>
              <p>라. 약관 동의 및 개인정보 제공(판매자/배송사 제공 등) 확인</p>
              <p>마. 결제수단 선택 및 결제</p>
            </div>
            <p>2. 회사는 이용자가 구매신청을 함에 있어 상품정보, 판매자 정보, 가격, 배송비, 청약철회 조건 등을 알기 쉽게 제공하도록 노력합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제11조(계약의 성립)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자와 판매자 간 매매계약은 이용자의 구매신청에 대해 판매자가 승낙하고, 결제가 완료된 시점에 성립하는 것을 원칙으로 합니다.</p>
            <p>2. 회사는 판매자 또는 회사의 승낙 의사표시를 수신확인통지(주문확인, 결제완료 안내 등) 형태로 이용자에게 제공합니다.</p>
            <p>3. 미성년자가 구매하는 경우 법정대리인의 동의를 얻지 못하면 미성년자 본인 또는 법정대리인이 계약을 취소할 수 있습니다(관계 법령이 정하는 범위 내).</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제12조(결제 및 결제대행)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 서비스에서 제공되는 가용 결제수단으로 결제할 수 있으며, 회사는 결제처리를 위해 결제대행사(토스페이먼츠)를 이용할 수 있습니다.</p>
            <p>2. 회사는 원칙적으로 이용자의 카드번호, 카드비밀번호 등 결제수단의 민감정보를 직접 저장·처리하지 않으며, 결제대행사 결제창을 통해 처리될 수 있습니다.</p>
            <p>3. 결제취소/환불은 관계 법령 및 본 약관, 서비스 내 환불정책, 판매자 정책(해당 시)에 따라 처리됩니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제13조(배송)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 배송 주체는 원칙적으로 판매자이며, 회사는 배송 진행 확인을 위한 기능을 제공합니다.</p>
            <p>2. 판매자는 이용자와 별도의 약정이 없는 한, 결제완료일로부터 합리적인 기간 내에 재화 등을 배송하여야 합니다. 단, 커스텀 상품은 제작기간이 추가될 수 있으며, 해당 내용은 상품페이지 또는 주문과정에서 고지합니다.</p>
            <p>3. 배송비, 배송방법, 배송기간 등은 상품페이지 또는 주문과정에 표시된 내용에 따릅니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제14조(품절 등과 환급)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 판매자가 품절 등 사유로 재화 등의 제공이 불가능한 경우 지체 없이 그 사유를 이용자에게 통지합니다.</p>
            <p>2. 사전에 대금을 받은 경우, 관계 법령에 따라 환급 또는 환급에 필요한 조치를 진행합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제15조(청약철회 등: 일반상품)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 관계 법령에 따라 재화 등을 공급받은 날로부터 7일 이내에 청약철회(취소/반품/교환)를 요청할 수 있습니다. 다만, 법령상 청약철회 제한 사유에 해당하거나 본 약관 제16조에 해당하는 경우에는 제한될 수 있습니다.</p>
            <p>2. 청약철회 요청은 서비스 내 기능 또는 고객센터를 통해 접수할 수 있으며, 실제 처리(수거, 검수, 환불 등)는 판매자가 수행하는 것을 원칙으로 합니다. 회사는 원활한 처리를 위해 중재·지원할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제16조(청약철회 제한: 커스텀/주문제작 및 예외)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 커스텀 상품은 그 특성상 결제 완료 즉시 제작(가공, 준비, 제작 지시 포함)이 착수됩니다.</p>
            <p>2. 이용자는 커스텀 상품에 관하여 결제 완료 이후에는 원칙적으로 청약철회(취소)를 할 수 없습니다. 다만, 관계 법령이 허용하는 범위 내에서 예외가 인정되는 경우(예: 표시·광고 또는 계약내용과 다르게 이행된 경우 등)에는 그러하지 아니합니다.</p>
            <p>3. 회사 및 판매자는 커스텀 상품의 청약철회 제한 사실과 그 사유를 상품페이지 또는 주문과정에서 이용자가 쉽게 알 수 있도록 고지하고, 필요한 경우 별도의 확인(체크박스 등)을 받을 수 있습니다.</p>
            <p>4. 커스텀 상품의 제작 착수 전 변경·정정 가능 범위(있는 경우) 및 제작 착수 이후 변경 불가 사항은 상품페이지 또는 주문과정 또는 판매자 안내에 따릅니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제17조(청약철회 등의 효과 및 환불)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 판매자는 재화 등을 반환받은 날로부터 관계 법령이 정하는 기간 내에 대금을 환급합니다.</p>
            <p>2. 이용자가 신용카드 등으로 결제한 경우, 판매자는 결제대행사 등을 통해 승인 취소 또는 대금 청구 정지·취소가 이루어지도록 필요한 조치를 합니다.</p>
            <p>3. 단순변심에 의한 청약철회 시 반환에 필요한 비용(왕복배송비 등)은 이용자가 부담할 수 있으며, 표시·광고 또는 계약내용과 다르게 이행된 경우에는 판매자가 부담합니다. 구체 기준은 상품페이지 또는 환불정책에서 안내합니다.</p>
            <p>4. 환불 금액은 이용자가 실제로 결제한 금액(쿠폰 할인 적용 후 실 결제금액)을 기준으로 산정됩니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제18조(쿠폰)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 쿠폰의 종류, 유효기간(쿠폰별 상이), 사용조건(적용 대상, 최소구매금액, 중복할인 가능 여부 등)은 서비스 내 표시 또는 별도 운영정책에 따릅니다.</p>
            <p>2. 쿠폰은 현금으로 환급되지 않으며, 주문 환불 시에도 쿠폰 할인액 자체는 현금으로 지급되지 않습니다. 환불금은 제17조 제4항에 따라 실 결제금액을 기준으로 합니다.</p>
            <p>3. 쿠폰 사용 후 주문이 취소·환불되는 경우, 쿠폰의 복구(재지급) 여부는 쿠폰별 정책 및 유효기간에 따르며, 유효기간 만료 등 사유로 복구되지 않을 수 있습니다.</p>
            <p>4. 부정한 방법으로 쿠폰을 취득하거나 사용한 경우, 회사는 해당 쿠폰의 사용을 제한 또는 회수하고 이용제한 등 필요한 조치를 할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제19조(개인정보보호)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 관계 법령에 따라 이용자의 개인정보를 보호하며, 개인정보의 수집·이용·제공·위탁 등에 관한 사항은 "개인정보처리방침"에 따릅니다.</p>
            <p>2. 회사는 주문 이행을 위하여 필요한 범위에서 판매자 및 배송사에 이용자의 개인정보(수령인, 연락처, 주소 등)를 제공할 수 있으며, 제공 항목 및 목적, 보유기간은 개인정보처리방침 및 주문과정 고지에 따릅니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제20조(회사의 의무)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 안정적인 서비스 제공을 위해 노력합니다.</p>
            <p>2. 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 개인정보 보호 및 보안 시스템을 갖추기 위해 노력합니다.</p>
            <p>3. 회사는 이용자가 원하지 않는 영리 목적의 광고성 정보를 전송하지 않으며, 전송하는 경우 관계 법령에 따른 동의를 받습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제21조(회원의 ID 및 비밀번호 관리)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. ID 및 비밀번호에 관한 관리책임은 회원에게 있으며, 회원은 이를 제3자에게 이용하게 해서는 안 됩니다.</p>
            <p>2. 회원이 도난 또는 제3자 사용을 인지한 경우 즉시 회사에 통지하고 회사의 안내에 따라야 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제22조(이용자의 의무 및 금지행위)</h3>
          <div className="space-y-2 text-gray-700">
            <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <div className="ml-4 space-y-1">
              <p>1. 신청 또는 변경 시 허위내용 등록</p>
              <p>2. 타인의 정보 도용</p>
              <p>3. 서비스 내 게시된 정보의 무단 변경</p>
              <p>4. 회사가 정하지 않은 정보(프로그램 등)의 송신 또는 게시</p>
              <p>5. 회사 또는 제3자의 저작권 등 지식재산권 침해</p>
              <p>6. 회사 또는 제3자의 명예 훼손, 업무 방해</p>
              <p>7. 외설·폭력적 내용 등 공서양속에 반하는 정보의 게시</p>
              <p>8. 쿠폰 부정수취·부정사용, 부정환불 등 부정행위</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제23조(게시물의 관리 및 저작권)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자가 서비스에 게시한 리뷰, 이미지, 문의(Q&A) 등 게시물(이하 "게시물")의 저작권은 이용자에게 귀속됩니다.</p>
            <p>2. 이용자는 게시물을 게시함으로써 회사에 대하여 서비스 운영 및 서비스 내 노출 목적 범위에서 게시물을 무상으로 이용(복제, 전송, 전시, 배포, 2차적 저작물 작성 등)할 수 있는 권한을 허락합니다.</p>
            <p>3. 회사가 게시물을 서비스 외부 채널(광고/홍보 등)에서 활용하는 경우, 관계 법령이 요구하는 경우에는 별도의 동의 절차를 거치거나, 서비스 내 고지된 방법으로 이용자가 중단을 요청할 수 있도록 합니다.</p>
            <p>4. 회사는 다음 각 호의 경우 게시물을 사전 통지 없이 삭제 또는 임시조치할 수 있습니다.</p>
            <div className="ml-4 space-y-1">
              <p>가. 법령 또는 타인의 권리를 침해하는 경우(저작권, 명예훼손, 개인정보 노출 등)</p>
              <p>나. 허위사실, 광고성 게시물, 도배 등 서비스 운영을 방해하는 경우</p>
              <p>다. 기타 서비스 운영정책에서 정한 사유에 해당하는 경우</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제24조(연결 서비스)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 서비스는 외부 사이트로 연결될 수 있으며, 회사는 외부 사이트가 제공하는 재화 등 또는 서비스에 관하여 보증 책임을 지지 않습니다.</p>
            <p>2. 외부 사이트 이용으로 발생한 분쟁은 해당 사이트 운영자와 이용자 간에 해결함을 원칙으로 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제25조(분쟁해결)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 처리하기 위하여 고객센터를 운영하며, 필요 시 분쟁해결 절차를 안내합니다.</p>
            <p>2. 회사와 이용자 간 전자상거래 분쟁과 관련하여 이용자의 피해구제 신청이 있는 경우, 관계 법령에 따른 분쟁조정기관의 조정에 따를 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제26조(재판권 및 준거법)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사와 이용자 간 발생한 분쟁에 관한 소송은 제소 당시 이용자의 주소를 관할하는 법원을 원칙으로 하며, 주소가 없는 경우 거소를 관할하는 법원으로 합니다. 다만, 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</p>
            <p>2. 본 약관 및 서비스 이용과 관련된 분쟁에는 대한민국 법령을 적용합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">부칙</h3>
          <div className="text-gray-700">
            <p><strong>제1조(시행일)</strong></p>
            <p>본 약관은 2026. 01. 07.부터 시행합니다.</p>
            <p className="text-sm text-gray-500">(이전 버전: 2025. 06. 17. 시행본)</p>
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
          <div className="text-gray-700 mb-4">
            <p>에르모세아르(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제1조(목적)</h3>
          <div className="text-gray-700">
            <p>본 방침은 회사가 제공하는 서비스(이하 "서비스") 이용과정에서 처리되는 개인정보의 처리 기준 및 정보주체의 권리·의무, 보호조치 등을 규정함을 목적으로 합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제2조(용어의 정의)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. "개인정보"란 살아있는 개인에 관한 정보로서 개인을 알아볼 수 있는 정보(다른 정보와 쉽게 결합하여 알아볼 수 있는 정보를 포함)를 말합니다.</p>
            <p>2. "이용자(정보주체)"란 서비스에 접속하여 본 방침에 따라 회사가 처리하는 개인정보의 주체가 되는 자를 말합니다.</p>
            <p>3. "판매자(입점 브랜드)"란 회사의 서비스에 입점하여 이용자에게 상품을 판매하는 자를 말하며, 경우에 따라 이용자의 개인정보를 독립적으로 처리하는 제3자가 될 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제3조(개인정보 처리항목 및 수집방법)</h3>
          <div className="space-y-4 text-gray-700">
            <p>회사는 최소한의 개인정보를 처리하며, 수집·이용 목적 달성에 필요한 범위 내에서 아래 항목을 처리합니다.</p>

            <div>
              <p className="font-medium mb-2">1. 수집·처리 항목</p>

              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium">가. 회원(구매자) 가입 및 계정 관리</p>
                  <p>- (필수) 이메일 주소, 비밀번호, 이름, 닉네임, 생년월일, 휴대폰 번호</p>
                  <p>- (서비스 이용과정 생성정보) 서비스 이용기록, 접속 로그, 쿠키, 접속 IP, 접속지 정보, 기기정보(기기식별값, OS/브라우저 정보 등)</p>
                </div>

                <div>
                  <p className="font-medium">나. 본인확인(휴대폰 본인인증)</p>
                  <p>- (필수) 이름, 생년월일, 성별, 휴대폰 번호, 이동통신사, 내/외국인 여부, 본인확인값(CI/DI 등 본인확인기관이 생성·제공하는 값)</p>
                  <p>- 사용 범위: (1) 회원가입 시 본인확인, (2) 아이디 찾기, (3) 비밀번호 재설정(본인확인) 시</p>
                </div>

                <div>
                  <p className="font-medium">다. 주문/배송</p>
                  <p>- (필수) 수령인 이름, 휴대폰 번호, 배송지 주소(상세주소 포함)</p>
                  <p>- (선택/필요 시) 공동현관 출입정보, 배송메모</p>
                </div>

                <div>
                  <p className="font-medium">라. 결제/환불(토스페이먼츠 연동)</p>
                  <p>- 회사는 카드번호·카드비밀번호 등 결제수단의 민감정보를 직접 저장·처리하지 않습니다.</p>
                  <p>- (회사 처리 항목) 주문번호, 결제금액, 결제수단 구분, 결제승인/취소/환불 상태, 승인번호(또는 거래식별정보), 현금영수증 발행 요청정보(필요 시 휴대폰번호 또는 식별정보)</p>
                  <p>- 결제에 필요한 결제수단의 세부정보는 토스페이먼츠에서 처리될 수 있습니다(제7조 참조).</p>
                </div>

                <div>
                  <p className="font-medium">마. 고객상담/분쟁처리</p>
                  <p>- (필수) 문의자 정보(이름 또는 닉네임, 이메일, 휴대폰번호 중 선택된 연락수단), 문의/상담 내용, 처리이력</p>
                  <p>- (필요 시) 결제/주문 관련 확인을 위한 주문번호, 환불계좌 정보(환불이 계좌이체로 이루어지는 경우)</p>
                </div>

                <div>
                  <p className="font-medium">바. 판매자(입점) 회원(해당 시)</p>
                  <p>- (필수/필요 범위) 담당자 이름, 휴대폰번호, 이메일, 정산계좌 정보(예금주, 은행명, 계좌번호)</p>
                  <p>- (사업자 판매자일 경우) 상호, 사업자등록번호, 통신판매업 신고번호, 사업장 주소 등 판매자 자격 확인 및 정산·세무처리에 필요한 정보</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">2. 수집방법</p>
              <p>회사는 아래 방법으로 개인정보를 수집합니다.</p>
              <div className="ml-4 space-y-1">
                <p>가. 회원가입/프로필/주문서 등 서비스 화면에서 이용자가 직접 입력</p>
                <p>나. 본인확인 과정에서 본인확인기관을 통해 제공받음</p>
                <p>다. 서비스 이용 과정에서 자동 생성(로그, 쿠키, 기기정보 등)</p>
                <p>라. 고객센터/게시판/문의 접수 과정에서 이용자가 입력</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제4조(개인정보의 처리 목적)</h3>
          <div className="text-gray-700">
            <p>회사는 다음 목적 범위에서 개인정보를 처리합니다.</p>
            <div className="ml-4 mt-2 space-y-1">
              <p>1. 회원가입 및 계정관리(본인확인, 가입의사 확인, 회원제 서비스 제공, 부정이용 방지, 고지/통지)</p>
              <p>2. 재화/서비스 제공(상품 주문, 결제, 배송, 환불, 고객상담, 분쟁처리)</p>
              <p>3. 서비스 품질 개선 및 안전한 운영(이용기록 분석, 접속빈도/통계, 서비스 개선, 보안/부정이용 탐지)</p>
              <p>4. 이벤트/마케팅 정보 제공(사전 동의한 이용자에 한함)</p>
              <p>5. 법령상 의무 이행 및 대응(전자상거래 등 소비자보호 관련, 세무/회계, 분쟁/민원 처리 등)</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제5조(개인정보의 처리 및 보유기간)</h3>
          <div className="space-y-3 text-gray-700">
            <p>회사는 원칙적으로 개인정보 처리 목적 달성 시 지체 없이 파기합니다. 다만, 관련 법령 및 내부정책에 따라 아래 기간 동안 보관할 수 있습니다.</p>
            <div className="ml-4 space-y-2">
              <p>1. 회원정보: 회원 탈퇴 시까지(단, 관계법령에 따른 보존 또는 부정이용 방지 목적의 보관은 예외)</p>
              <p>2. 부정이용기록: 회원 탈퇴일로부터 최대 1년 보관(부정가입/부정이용 방지 목적)</p>
              <p>3. 법령에 따른 보관</p>
              <div className="ml-4 space-y-1">
                <p>가. 계약 또는 청약철회 등에 관한 기록: 5년</p>
                <p>나. 대금결제 및 재화 등의 공급에 관한 기록: 5년</p>
                <p>다. 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>
                <p>라. 표시·광고에 관한 기록: 6개월</p>
                <p>마. 웹사이트 접속기록(로그): 3개월</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">※ 서비스 형태 및 관계법령에 따라 보관 항목/기간은 조정될 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제6조(개인정보의 제3자 제공)</h3>
          <div className="space-y-4 text-gray-700">
            <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자가 상품을 구매하는 경우 거래 이행을 위해 판매자 및 배송사에 제공될 수 있습니다.</p>

            <div>
              <p className="font-medium mb-2">1. 판매자(입점 브랜드) 제공</p>
              <div className="ml-4 space-y-1">
                <p>가. 제공받는 자: 이용자가 구매한 상품의 판매자(입점 브랜드)</p>
                <p className="text-sm text-gray-500">- 판매자명/연락처는 상품 상세, 주문/결제 화면 또는 판매자 정보 페이지에서 확인할 수 있습니다.</p>
                <p>나. 제공 목적: 주문 확인, 상품 준비·발송, 고객상담, 교환/반품/환불 처리, 거래 이행</p>
                <p>다. 제공 항목: 수령인 이름, 휴대폰 번호, 배송지 주소, 주문상품/옵션, 배송메모(필요 시)</p>
                <p>라. 보유·이용기간: 구매 서비스 종료 후 1개월 또는 판매자에게 적용되는 관계법령상 보존기간까지</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">2. 배송사 제공</p>
              <div className="ml-4 space-y-1">
                <p>가. 제공받는 자: 판매자가 선택한 배송사(택배사 등)</p>
                <p className="text-sm text-gray-500">- 배송사 정보는 주문/배송 조회 화면에서 확인할 수 있습니다.</p>
                <p>나. 제공 목적: 상품 배송 및 배송상담</p>
                <p>다. 제공 항목: 수령인 이름, 휴대폰 번호, 배송지 주소, 배송메모(필요 시)</p>
                <p>라. 보유·이용기간: 배송 완료 후 3개월(분쟁 대응 목적) 또는 배송사 정책 및 관계법령에 따른 보존기간까지</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제7조(개인정보 처리의 위탁)</h3>
          <div className="space-y-4 text-gray-700">
            <p>회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁할 수 있으며, 수탁자에 대하여 관련 법령에 따라 관리·감독을 수행합니다.</p>

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <p className="font-medium">[위탁 현황]</p>

              <div>
                <p className="font-medium">1) 결제대행(PG)</p>
                <div className="ml-4 space-y-1">
                  <p>- 수탁자: 토스페이먼츠</p>
                  <p>- 위탁업무 내용: 결제 처리, 결제 승인/취소/환불 처리, 결제 관련 고객응대(필요 시)</p>
                  <p>- 위탁 항목: 주문·결제 식별정보, 결제금액, 결제수단 구분, 거래정보 등</p>
                  <p className="text-sm text-gray-500">※ 결제수단의 세부정보는 토스페이먼츠가 처리할 수 있습니다.</p>
                </div>
              </div>

              <div>
                <p className="font-medium">2) 인프라/호스팅</p>
                <div className="ml-4 space-y-1">
                  <p>- 수탁자: Amazon Web Services, Inc.(AWS)</p>
                  <p>- 위탁업무 내용: 클라우드 인프라 운영(서버 호스팅, 데이터 저장/백업, 장애대응)</p>
                  <p>- 위탁 항목: 서비스 운영 중 처리되는 개인정보 전반(저장·백업 포함)</p>
                </div>
              </div>

              <div>
                <p className="font-medium">3) 본인확인(휴대폰 본인인증)</p>
                <div className="ml-4 space-y-1">
                  <p>- 수탁자: [본인확인기관명 기재 필요]</p>
                  <p>- 위탁업무 내용: 휴대폰 본인확인, 가입자/본인 여부 확인, 아이디 찾기/비밀번호 재설정 본인확인</p>
                  <p>- 위탁 항목: 이름, 생년월일, 성별, 휴대폰번호, 통신사, 내/외국인 여부, CI/DI 등</p>
                </div>
              </div>

              <div>
                <p className="font-medium">4) 문자/메일 발송</p>
                <p className="ml-4">- 현재 외부 문자/메일 발송대행사를 사용하지 않습니다(향후 사용 시 본 방침에 반영합니다).</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제8조(개인정보의 국외 이전)</h3>
          <div className="space-y-3 text-gray-700">
            <p>회사는 서비스 운영을 위해 AWS를 사용하며, 이용자의 개인정보가 대한민국(서울) 및 호주(시드니) 리전에서 저장·백업·처리될 수 있습니다.</p>

            <div className="ml-4 space-y-2">
              <p>1. 이전받는 자: Amazon Web Services, Inc.(AWS)</p>
              <p>2. 이전 국가: 호주(Australia) – Sydney 리전</p>
              <p>3. 이전되는 개인정보 항목: 서비스 이용 중 처리·저장되는 개인정보(회원정보, 주문/배송정보, 상담정보, 로그 등)</p>
              <p>4. 이전 목적: 클라우드 인프라 운영(서버 호스팅, 데이터 저장/백업, 장애 대응, 보안)</p>
              <p>5. 이전 시점 및 방법: 서비스 이용 과정에서 네트워크를 통한 전송 및 저장(수집 시점부터 저장·백업이 발생할 수 있음)</p>
              <p>6. 보유·이용기간: 위탁계약 종료 또는 이용 목적 달성 시까지(관계법령상 보관의무가 있는 경우 해당 기간)</p>
              <p>7. 동의 거부 권리 및 불이익: 이용자는 국외이전에 대한 동의를 거부할 수 있으나, 국외이전이 서비스 운영에 필수적인 경우 서비스 제공이 제한될 수 있습니다.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제9조(개인정보의 파기절차 및 방법)</h3>
          <div className="space-y-3 text-gray-700">
            <p>회사는 개인정보 처리 목적 달성 또는 보유기간 경과 시 지체 없이 파기합니다.</p>
            <div className="ml-4 space-y-2">
              <p>1. 파기절차: 파기사유 발생 → 내부 검토 및 승인 → 파기</p>
              <p>2. 파기방법:</p>
              <div className="ml-4">
                <p>가. 전자적 파일: 복구 불가능한 방식으로 영구 삭제</p>
                <p>나. 종이 문서: 분쇄 또는 소각</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제10조(정보주체의 권리·의무 및 행사방법)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 이용자는 언제든지 본인 개인정보에 대한 열람, 정정·삭제, 처리정지, 동의철회 등을 요청할 수 있습니다.</p>
            <p>2. 권리행사는 서비스 내 기능(설정/회원정보) 또는 제13조의 연락처를 통해 요청할 수 있으며, 회사는 관련 법령에 따라 지체 없이 조치합니다.</p>
            <p>3. 이용자는 개인정보를 최신 상태로 유지해야 하며, 부정확한 정보로 인한 불이익은 이용자에게 발생할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제11조(개인정보의 안전성 확보조치)</h3>
          <div className="space-y-2 text-gray-700">
            <p>회사는 개인정보의 안전성을 확보하기 위해 관리적·기술적·물리적 조치를 시행합니다.</p>
            <div className="ml-4 space-y-1">
              <p>1. 비밀번호 일방향 암호화 저장 및 인증정보 보호</p>
              <p>2. 접근권한 최소화 및 권한관리, 접근통제, 접속기록 보관 및 점검</p>
              <p>3. 전송구간 암호화(HTTPS 등), 악성코드 방지, 취약점 점검</p>
              <p>4. 내부관리계획 수립, 개인정보 취급자 교육, 수탁사 관리·감독</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제12조(개인정보 자동수집 장치의 설치·운영 및 거부)</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. 회사는 서비스 제공을 위해 쿠키를 사용할 수 있습니다.</p>
            <p>2. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 거부 시 일부 기능 이용에 제한이 있을 수 있습니다.</p>
            <p>3. 쿠키 설정 변경 방법(예시)</p>
            <div className="ml-4 space-y-1">
              <p>- Edge: 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트 데이터 관리 및 삭제</p>
              <p>- Chrome: 설정 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</p>
              <p>- Whale: 설정 &gt; 개인정보 보호 &gt; 쿠키 및 기타 사이트 데이터</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제13조(개인정보 보호책임자 및 담당부서)</h3>
          <div className="space-y-4 text-gray-700">
            <p>회사는 개인정보 보호 관련 문의·불만 처리 및 피해구제를 위하여 아래와 같이 책임자 및 담당자를 지정합니다.</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">1. 개인정보 보호책임자</p>
              <ul className="ml-4 space-y-1">
                <li>성명: 김동현</li>
                <li>직책: CEO</li>
                <li>전화번호: 010-9611-1711</li>
                <li>이메일: jlionk200@gmail.com</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">2. 개인정보 보호 담당자(열람청구 등)</p>
              <ul className="ml-4 space-y-1">
                <li>담당부서: 개발팀</li>
                <li>담당자: 허정민</li>
                <li>전화번호: 010-6469-0459</li>
                <li>이메일: heobusy@gmail.com</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제14조(개인정보 유출 통지·신고 및 권익침해 구제)</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. 회사는 개인정보 유출 사실을 인지한 경우 지체 없이 이용자에게 통지하고, 법령상 요건에 해당하면 개인정보보호위원회 및 KISA 등에 신고합니다.</p>
            <p>2. 이용자는 개인정보 침해로 인한 구제를 위해 아래 기관에 상담·신고할 수 있습니다.</p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>- 개인정보침해신고센터: (국번없이) 118</li>
              <li>- 개인정보분쟁조정위원회: (국번없이) 1833-6972</li>
              <li>- 대검찰청: (국번없이) 1301</li>
              <li>- 경찰청: (국번없이) 182</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">제15조(광고성 정보 전송)</h3>
          <div className="space-y-2 text-gray-700">
            <p>1. 회사는 영리목적의 광고성 정보를 전송하는 경우 원칙적으로 사전 동의를 받습니다.</p>
            <p>2. 수신거부 또는 동의철회 시 즉시 전송을 중단합니다.</p>
            <p>3. 현재 회사는 외부 문자/메일 발송대행사를 사용하지 않습니다(향후 변경 시 본 방침에 반영합니다).</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">부칙</h3>
          <div className="text-gray-700">
            <p>본 방침은 2026. 01. 07.부터 시행됩니다.</p>
            <p className="text-sm text-gray-500">(이전 버전: 2025. 06. 17. 시행본)</p>
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