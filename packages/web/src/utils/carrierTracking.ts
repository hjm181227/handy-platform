/**
 * 택배사 조회 URL 매핑.
 *
 * 판매자 송장 입력(SellerOrderCard)과 동일한 택배사 목록을 구매자
 * 배송조회에서 재사용한다. 서버 기본값 'CJ_LOGISTICS' 같은 이형 코드도
 * 이름/별칭으로 정규화한다.
 */
export const SHIPPING_CARRIERS = [
  { code: 'hanjin', name: '한진택배', trackingUrl: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText=' },
  { code: 'cj', name: 'CJ대한통운', trackingUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?parcelnumber=' },
  { code: 'lotte', name: '롯데택배', trackingUrl: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?invno=' },
  { code: 'logen', name: '로젠택배', trackingUrl: 'https://www.ilogen.com/web/personal/trace/_tab2.jsp?slipno=' },
  { code: 'kdexp', name: '경동택배', trackingUrl: 'https://kdexp.com/service/delivery/delivery_result.asp?barcode=' },
  { code: 'kpost', name: '우체국택배', trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' },
  { code: 'daesin', name: '대신택배', trackingUrl: 'http://apps.ds3211.co.kr/freight/internalFreightSearch.cht?billno=' },
  { code: 'epost', name: 'K택배', trackingUrl: 'https://www.kglogis.co.kr/delivery/delivery_result.jsp?item_no=' }
];

const CODE_ALIASES: Record<string, string> = {
  CJ_LOGISTICS: 'cj',
  HANJIN: 'hanjin',
  LOTTE: 'lotte',
  LOGEN: 'logen',
  EPOST: 'kpost'
};

export function findCarrier(carrierCode?: string, carrierName?: string) {
  if (carrierCode) {
    const normalized = CODE_ALIASES[carrierCode] || carrierCode.toLowerCase();
    const byCode = SHIPPING_CARRIERS.find(c => c.code === normalized);
    if (byCode) return byCode;
  }
  if (carrierName) {
    const byName = SHIPPING_CARRIERS.find(c => carrierName.includes(c.name) || c.name.includes(carrierName));
    if (byName) return byName;
  }
  return null;
}

export function getTrackingUrl(carrierCode?: string, carrierName?: string, trackingNumber?: string): string | null {
  if (!trackingNumber) return null;
  const carrier = findCarrier(carrierCode, carrierName);
  if (!carrier) return null;
  return carrier.trackingUrl + encodeURIComponent(trackingNumber.replace(/[^0-9]/g, ''));
}
