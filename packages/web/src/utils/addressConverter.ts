import type { 
  KoreanAddress, 
  KoreanAddressResponse, 
  KoreanRegion
} from '@handy-platform/shared';

/**
 * 이 변환기가 다루는 "구버전" 배송지 형태.
 *
 * 현행 shared ShippingAddress 는
 * recipientName/recipientPhone/postcode/roadAddress/detailAddress/deliveryNote 를 쓰지만,
 * 이 파일과 이를 호출하는 purchaseApiService 의 배송지 CRUD 경로는 아직
 * phone/address/addressDetail/zipCode/memo 라는 옛 필드명을 전제로 한다.
 * 현행 타입을 억지로 붙이면 계약을 왜곡하므로 레거시 형태를 별도 타입으로 명시한다.
 */
export interface LegacyShippingAddress {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string;
  zipCode: string;
  memo?: string;
  addressName?: string;
  isDefault?: boolean;
}

/**
 * 주소에서 한국 지역을 자동 감지하는 함수
 */
export const detectRegion = (address: string): KoreanRegion => {
  const addr = address.toLowerCase();
  
  // 서울특별시
  if (addr.includes('서울')) {
    return 'seoul';
  }
  
  // 수도권 (인천, 경기)
  if (addr.includes('인천') || addr.includes('경기')) {
    return 'metropolitan';
  }
  
  // 제주도
  if (addr.includes('제주')) {
    return 'jeju';
  }
  
  // 도서산간 지역 키워드
  const remoteKeywords = ['울릉', '백령', '연평', '소청', '대청', '옹진'];
  if (remoteKeywords.some(keyword => addr.includes(keyword))) {
    return 'remote';
  }
  
  // 나머지는 일반지역
  return 'general';
};

/**
 * 배송지명을 자동 생성하는 함수
 */
export const generateAddressName = (address: LegacyShippingAddress): string => {
  const addr = address.address.toLowerCase();
  
  if (addr.includes('회사') || addr.includes('오피스') || addr.includes('사무실')) {
    return '회사';
  }
  
  if (addr.includes('학교') || addr.includes('대학') || addr.includes('캠퍼스')) {
    return '학교';
  }
  
  // 기본값
  return '집';
};

/**
 * KoreanAddressResponse를 ShippingAddress로 변환
 */
export const convertToShippingAddress = (korean: KoreanAddressResponse): LegacyShippingAddress & { addressName: string } => {
  const baseAddress: LegacyShippingAddress = {
    id: korean.index.toString(),
    recipientName: korean.recipientName,
    phone: korean.recipientPhone,
    address: korean.roadAddress,
    addressDetail: korean.detailAddress,
    zipCode: korean.postcode,
    memo: korean.deliveryNote || '',
    isDefault: korean.isDefault || false
  };

  return {
    ...baseAddress,
    // 추가 필드 (addressName을 별도로 처리)
    addressName: korean.addressName || generateAddressName(baseAddress)
  };
};

/**
 * ShippingAddress를 KoreanAddress로 변환
 */
export const convertToKoreanAddress = (shipping: LegacyShippingAddress): KoreanAddress => {
  return {
    recipientName: shipping.recipientName,
    recipientPhone: shipping.phone,
    postcode: shipping.zipCode,
    roadAddress: shipping.address,
    jibunAddress: shipping.address, // 임시로 도로명주소와 동일하게 설정
    detailAddress: shipping.addressDetail || '',
    extraAddress: '', // ShippingAddress에는 extraAddress가 없으므로 빈 값
    region: detectRegion(shipping.address),
    deliveryNote: shipping.memo,
    addressName: shipping.addressName || generateAddressName(shipping),
    isDefault: shipping.isDefault
  };
};

/**
 * ShippingAddress 배열을 KoreanAddressResponse 배열로 변환
 */
export const convertToKoreanAddressList = (addresses: LegacyShippingAddress[]): KoreanAddressResponse[] => {
  return addresses.map((address, index) => ({
    ...convertToKoreanAddress(address),
    index: parseInt(address.id) || index,
    lastUsed: new Date().toISOString(),
    fullAddress: `${address.address} ${address.addressDetail || ''}`.trim(),
    displayName: `${address.addressName || generateAddressName(address)} (${address.recipientName})`
  }));
};

/**
 * KoreanAddressResponse 배열을 ShippingAddress 배열로 변환
 */
export const convertToShippingAddressList = (addresses: KoreanAddressResponse[]): LegacyShippingAddress[] => {
  return addresses.map(convertToShippingAddress);
};