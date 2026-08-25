import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@handy-platform/shared';
import { PrivacyPolicy, TermsOfService } from './PolicyPages';

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
export function PartnerInquiryPage({ onGo, type }: { onGo: (to: string) => void; type: string }) {
  const { t } = useTranslation('nav');
  const titles: { [key: string]: string } = {
    "입점 문의": "입점 문의",
    "광고/제휴 문의": "광고/제휴 문의",
    "협찬 문의": "협찬 문의",
    "공동/대량 구매 문의": "공동/대량 구매 문의",
    "제조/생산 문의": "제조/생산 문의",
    "이미지/저작권 문의": "이미지/저작권 문의"
  };

  return (
    <PageLayout title={titles[type] || t('footer.partnerInquiry')} onBack={() => onGo("/")}>
      <div className="bg-white rounded-lg p-6">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('footer.companyName')}</label>
            <input type="text" className="w-full p-2 border rounded-lg" placeholder={t('footer.companyName')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('footer.contactPerson')}</label>
            <input type="text" className="w-full p-2 border rounded-lg" placeholder={t('footer.contactPerson')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('footer.contactPhone')}</label>
            <input type="tel" className="w-full p-2 border rounded-lg" placeholder={t('footer.contactPhone')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('footer.contactEmail')}</label>
            <input type="email" className="w-full p-2 border rounded-lg" placeholder={t('footer.contactEmail')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('footer.inquiryContent')}</label>
            <textarea
              className="w-full p-2 border rounded-lg h-32 resize-none"
              placeholder={t('footer.inquiryContent')}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand-600"
            onClick={(e) => {
              e.preventDefault();
              alert(t('footer.inquirySubmitted'));
            }}
          >
            {t('footer.submitInquiry')}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

// 정책 페이지들
export function PolicyPage({ onGo, type }: { onGo: (to: string) => void; type: string }) {
  const { i18n } = useTranslation();

  // ?lang= 쿼리 파라미터로 언어 전환 지원
  useEffect(() => {
    const langParam = new URLSearchParams(window.location.search).get('lang');
    if (langParam && (SUPPORTED_LANGUAGES as readonly string[]).includes(langParam)) {
      i18n.changeLanguage(langParam as SupportedLanguage);
    }
  }, [i18n]);

  // 개인정보처리방침과 이용약관은 상세 컴포넌트 사용
  if (type === 'privacy') {
    return <PrivacyPolicy onClose={() => onGo("/")} />;
  }

  if (type === 'terms') {
    return <TermsOfService onClose={() => onGo("/")} />;
  }

  // 나머지 정책들은 기존 방식 유지
  const contents: { [key: string]: { title: string; content: string } } = {
    pg: {
      title: "결제대행 위탁사",
      content: `
결제대행(전자결제) 처리위탁 안내

핸디는 안전하고 편리한 결제 서비스 제공을 위하여 아래와 같이 결제 처리 업무를 외부 전문업체에 위탁하고 있습니다.

1. 위탁(처리위탁) 목적
- 신용카드/체크카드/간편결제 등 전자결제의 승인, 매입, 정산, 취소, 환불 처리
- 부정결제 방지 및 결제 관련 민원 처리 지원(필요 시)

2. 위탁(수탁) 현황
(1) 수탁자: 토스페이먼츠 주식회사
- 위탁업무: 신용카드, 체크카드, 간편결제 결제 처리(승인/취소/환불 등)
- 제공되는 정보: 거래식별정보(주문번호/거래번호), 결제금액, 결제승인/취소/환불 정보, 결제처리에 필요한 범위의 이용자 식별정보
  ※ 회사는 원칙적으로 이용자의 카드번호/비밀번호 등 결제수단의 민감정보를 직접 저장·관리하지 않으며, 해당 정보는 결제대행사 결제창 등을 통해 처리될 수 있습니다.
- 보유기간: 거래완료 후 5년(관련 법령에 따른 거래기록 보관기간)

(2) 수탁자: 주식회사 카카오페이
- 위탁업무: 카카오페이 간편결제 처리(승인/취소/환불 등)
- 제공되는 정보: 거래식별정보(주문번호/거래번호), 결제금액, 결제승인/취소/환불 정보, 결제처리에 필요한 범위의 이용자 식별정보
  ※ 회사는 원칙적으로 이용자의 카드번호/비밀번호 등 결제수단의 민감정보를 직접 저장·관리하지 않으며, 해당 정보는 카카오페이 결제 절차를 통해 처리될 수 있습니다.
- 보유기간: 거래완료 후 5년(관련 법령에 따른 거래기록 보관기간)

3. 위탁에 따른 관리·감독
회사는 개인정보 처리업무 위탁 시 관계 법령에 따라 위탁계약 체결, 수탁자에 대한 관리·감독 및 안전성 확보조치 이행 여부를 점검하는 등 개인정보가 안전하게 처리되도록 필요한 조치를 하고 있습니다.

4. 변경 고지
수탁자 또는 위탁업무의 내용이 변경되는 경우, 회사는 개인정보처리방침 또는 별도 고지 방법을 통해 지체 없이 공개 또는 안내합니다.
      `
    },
    dispute: {
      title: "분쟁해결기준",
      content: `
제1장 총칙

제1조(목적)

통신판매 및 통신판매중개에서의 분쟁해결기준(이하 “분쟁해결기준”)은 「전자상거래 등에서의 소비자보호에 관한 법률」 제20조제3항에 따라 핸디(이하 “회사”)의 통신판매중개 또는 이를 통해 체결된 통신판매로 인해 발생한 분쟁의 원활한 해결을 위한 기준을 정함을 목적으로 한다.

제2조(정의)

분쟁해결기준에서 사용하는 용어의 뜻은 다음 각 호와 같다.


1. “통신판매”란 「전자상거래 등에서의 소비자보호에 관한 법률」 제2조 제2호에서 정한 통신판매를 말한다.


2. “통신판매중개”란 「전자상거래 등에서의 소비자보호에 관한 법률」 제2조 제4호에서 정한 통신판매중개를 말한다.


3. “판매자”란 “회사”가 제공하는 통신판매중개 서비스를 통하여 상품 또는 용역(이하 “상품등”)을 판매할 목적으로 “회원”과 거래한 사업자를 말한다.


4. “회원”이란 “회사”와 이용계약을 체결하고 “회사”가 제공하는 서비스를 이용하는 자로, 「전자상거래 등에서의 소비자보호에 관한 법률」 제2조 제5호에서 정한 소비자를 말한다.


5. “상대방”이란 회사의 통신판매중개를 통해 판매자와 상품등을 거래한 자 중 「전자상거래 등에서의 소비자보호에 관한 법률」 제2조 제5호에서 정한 소비자가 아닌 자를 말한다.

제3조(적용대상)

① 분쟁해결기준은 회사와 회원 간 분쟁 및 판매자와 회원 간 분쟁(이하 “소비자분쟁”)에 대해 적용된다.


② 분쟁해결기준에서 다르게 정한 경우를 제외하고, 분쟁해결기준은 회사와 상대방 간 분쟁 및 판매자와 상대방 간 분쟁(이하 통칭하여 “상대방분쟁”)에 대해 적용된다.

제4조(분쟁해결기준의 개정 및 다른 약정과의 관계)

① 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용 촉진 및 정보 보호 등에 관한 법률」, 「소비자기본법」 등 관계 법령을 위배하지 않는 범위에서 분쟁해결기준을 개정할 수 있다.


② 소비자분쟁 또는 상대방분쟁에 대해 분쟁해결기준에서 규정하지 않은 사항은 회사와 회원이 체결한 “핸디 이용약관”에 따르고, “핸디 이용약관”에도 규정되지 않은 사항은 회사와 판매자가 체결한 “핸디 판매회원 이용약관”에 따르며, 위 약관에서도 규정되지 않은 사항은 관계 법령 등에 따른다.


③ 분쟁해결기준의 내용과 관련하여 분쟁해결기준과 “핸디 이용약관”, “핸디 판매회원 이용약관”의 내용이 충돌하는 경우 “핸디 이용약관”, “핸디 판매회원 이용약관”, 분쟁해결기준의 내용 순으로 우선하여 적용된다.

제2장 회사와 회원 또는 상대방 간 분쟁 및 해결기준

제5조(청약철회등에 따른 대금의 환급등)

① 회사가 회원으로부터 대금을 지급받은 경우 회원이 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라 청약의 철회 및 계약의 해제(이하 “청약철회등”)를 하였을 때에 회사는 회원에게 대금을 환급한다.


② 회사는 제1항에 따른 대금환급의무를 다음 각 호에서 정한 기한까지 이행한다.


1. 회원이 재화를 공급받은 경우: 그 재화를 판매자에 반환한 날로부터 3영업일 이내


2. 회원이 용역 또는 디지털콘텐츠를 공급받은 경우: 회원이 청약철회등을 한 날로부터 3영업일 이내


3. 회원이 상품등을 공급받지 않은 경우: 회원이 청약철회등을 한 날로부터 3영업일 이내


③ 회원이 공급받은 상품등을 일부 사용하거나 소비한 경우, 회사는 제2항에 따라 대금을 환급함에 있어 「전자상거래 등에서의 소비자보호에 관한 법률」 제18조 제8항에서 정한 금액을 제외한 나머지 금액을 지급한다. 다만, “핸디 이용약관”에 따라 본조의 청약철회가 제한될 수 있다.


④ 회사가 제2항 및 제3항에 따른 대금환급을 지연한 경우에 그 지연기간에 대해 「전자상거래 등에서의 소비자보호에 관한 법률」 제18조 제2항에서 정한 지연배상금(이하 “지연배상금”)을 더하여 지급한다.


⑤ 회사는 제2항 및 제3항에 따라 대금을 환급할 때 「여신전문금융업법」 제2조 제3호의 신용카드나 그 밖에 「전자상거래 등에서의 소비자보호에 관한 법률 시행령」 제22조의 결제수단으로 재화등의 대금을 지급한 경우에는 지체 없이 해당 결제업자에게 재화등의 대금 청구를 정지하거나 취소하도록 요청하여야 한다.


⑥ 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제1항에 따른 청약철회등의 경우, 공급받은 재화등의 반환에 필요한 비용은 회원이 부담하며, 판매자는 회원에게 청약철회등을 이유로 위약금이나 손해배상을 청구할 수 없다.


⑦ 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제3항에 따른 청약철회등의 경우, 재화등의 반환에 필요한 비용은 판매자가 부담한다.

제6조(고지의무 또는 신원정보 미제공에 따른 회사의 책임)

① 회사가 통신판매중개를 하면서 회원에게 통신판매의 당사자가 아니라는 사실을 고지하지 않은 경우에 회사는 판매자의 고의 또는 과실로 회원에게 발생한 재산상 손해에 대해 판매자와 연대하여 배상한다.


② 회사가 통신판매중개를 하면서 「전자상거래 등에서의 소비자보호에 관한 법률」 제20조 제2항에 따른 판매자의 정보를 제공하지 않거나 제공한 정보가 사실과 달라 회원에게 발생한 재산상 손해에 대해 판매자와 연대하여 배상한다. 다만, 회사가 회원에게 피해가 발생하지 않도록 상당한 주의를 기울인 경우에는 그러하지 아니하다.

제3장 판매자와 회원 간 분쟁 및 해결기준

제1절 일반적 분쟁해결기준

제7조(상품등의 하자ㆍ채무불이행 등)

판매자는 상품등의 하자·채무불이행 등으로 인한 회원의 피해에 대하여 다음 각 호의 기준에 따라 수리·교환·환급 또는 배상을 하거나, 계약의 해제·해지 및 이행 등을 하여야 한다.


1. 품질보증기간 동안의 수리·교환·환급에 드는 비용은 판매자가 부담한다. 다만, 회원의 취급 잘못이나 천재지변으로 고장이나 손상이 발생한 경우와 제조자 및 제조자가 지정한 수리점·설치점이 아닌 자가 수리·설치하여 상품등이 변경되거나 손상된 경우에는 판매자가 비용을 부담하지 아니한다.


2. 수리는 지체 없이 하되, 수리가 지체되는 불가피한 사유가 있을 때는 회원에게 알려야 한다. 회원이 수리를 의뢰한 날부터 1개월이 지난 후에도 판매자가 수리된 상품등을 회원에게 인도하지 못할 경우에 품질보증기간 이내일 때는 같은 종류의 상품등으로 교환하거나 환급하고, 품질보증기간이 지났을 때에는 제13조에 따라 산정한 금액을 환급한다.


3. 상품등을 유상으로 수리한 경우에 그 유상으로 수리한 날부터 2개월 이내에 회원이 정상적으로 상품등을 사용하는 과정에서 그 수리한 부분에 종전과 동일한 고장이 재발한 경우에는 무상으로 수리하되, 수리가 불가능한 때에는 종전에 받은 수리비를 환급하여야 한다.


4. 교환은 같은 종류의 상품등으로 하되, 같은 종류의 상품등으로 교환하는 것이 불가능한 경우에는 같은 종류의 유사 상품등으로 교환한다. 다만, 같은 종류의 상품등으로 교환하는 것이 불가능하거나 회원이 같은 종류의 유사 상품등으로 교환하는 것을 원하지 아니하는 경우에는 환급한다. 이는 할인판매된 상품등을 교환하는 경우에도 같으며, 그 정상가격과 할인가격의 차액은 고려하지 않는다.


5. 환급금액은 거래 시 교부된 영수증 등에 적힌 상품등의 가격을 기준으로 한다. 다만, 영수증 등에 적힌 가격에 대하여 다툼이 있는 경우에는 영수증 등에 적힌 금액과 다른 금액을 기준으로 하려는 자가 그 다른 금액이 실제 거래가격임을 증명하여야 하며, 영수증이 없는 등의 사유로 실제 거래가격을 증명할 수 없는 경우에는 그 지역에서 거래되는 통상적인 가격을 기준으로 한다.

제8조(경품류의 하자ㆍ채무불이행 등)

판매자가 상품등의 거래에 부수(附隨)하여 회원에게 제공하는 경제적 이익인 경품류의 하자·채무불이행 등으로 인한 회원의 피해에 대한 분쟁해결기준은 제7조를 준용한다.

다만, 회원의 책임있는 사유로 계약이 해제되거나 해지되는 경우에 판매자는 회원으로부터 그 경품류를 반환받거나 반환이 불가능한 경우에는 해당 지역에서 거래되는 같은 종류의 유사 상품등의 통상적인 가격을 기준으로 가액반환을 받는다.

제9조(품질보증기간과 부품보유기간)

품질보증기간과 부품보유기간은 다음 각 호에서 정한 바에 따른다.


1. 품질보증기간과 부품보유기간은 해당 판매자가 품질보증서 등에 표시한 기간으로 한다. 다만, 이를 표시하지 않은 경우에는 제12조에서 정한 기간으로 한다.


2. 품질보증기간은 회원이 상품등을 구입하거나 제공받은 날부터 기산한다. 다만, 계약일과 인도일(용역의 경우에는 제공일을 말한다. 이하 이 호에서 같다)이 다른 경우에는 인도일을 기준으로 하고, 교환받은 상품등의 품질보증기간은 교환받은 날부터 기산한다.


3. 품질보증서에 판매일자가 적혀 있지 아니한 경우, 품질보증서 또는 영수증을 받지 아니하거나 분실한 경우 또는 그 밖의 사유로 판매일자를 확인하기 곤란한 경우에는 해당 상품등의 제조일이나 수입통관일부터 3월이 지난 날부터 품질보증기간을 기산하여야 한다. 다만, 상품등 또는 상품등의 포장에 제조일이나 수입통관일이 표시되어 있지 아니한 상품등은 판매자가 그 판매일자를 증명하여야 한다.

제10조(피해배상)

① 회원에 대한 판매자의 배상 또는 보상 방법은 달리 합의가 없는 한 금전 지급을 원칙으로 한다.


② 판매자는 배상 또는 보상을 위해 회원에게 재화의 반환을 요구할 수 있다. 다만, 판매자가 수거하기로 약정한 경우, 재화의 반환에 전문기술 등이 요구되는 경우 또는 회원이 반환하기 곤란한 경우에는 판매자가 수거한다.

제11조(경비의 부담)

판매자의 책임있는 사유로 인해 회원의 피해처리과정에서 발생되는 운반비용, 시험 및 검사비용 등의 경비는 판매자가 부담한다.

제2절 재화ㆍ시설 및 용역별 분쟁해결기준 등

제12조(재화별 품질보증기간 및 부품보유기간)

재화별 품질보증기간 및 부품보유기간은 「소비자기본법 시행령」에 따라 공정거래위원회가 고시하는 소비자분쟁해결기준의 <별표III>과 같다.

제13조(재화ㆍ시설 및 용역별 분쟁해결기준)

재화ㆍ시설 및 용역별 분쟁해결기준 중 인터넷쇼핑몰업에 대한 분쟁해결기준은 「소비자기본법 시행령」에 따라 공정거래위원회가 고시하는 소비자분쟁해결기준의 <별표II>와 같다.

제14조(재화별 내용연수표)

재화별 내용연수표는 「소비자기본법 시행령」에 따라 공정거래위원회가 고시하는 소비자분쟁해결기준의 <별표IV>과 같다.

부칙

제1조(시행일) 분쟁해결기준은 2025년 12월 22일부터 시행된다.
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
        
        <button className="bg-brand text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-600">
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