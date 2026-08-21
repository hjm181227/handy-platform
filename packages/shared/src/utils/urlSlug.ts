/**
 * URL 슬러그 생성 — 브랜드 주소(/brand/mammon)와 상품 링크 장식부에 사용.
 *
 * 서버(handy-app-server/utils/slug.ts)와 같은 규칙을 쓴다. 클라이언트가
 * 만든 링크를 서버가 그대로 해석해야 하므로 두 파일을 함께 고칠 것.
 *
 * 한글은 자모 단위로 로마자 변환한다. 국립국어원 표기법의 음운 동화 규칙까지
 * 따르지는 않지만(예: '핸디넬' 같은 연음), 결과가 예측 가능하고 셀러가
 * 직접 고칠 수 있으므로 이 수준으로 충분하다.
 */

const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o',
  'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu',
  'eu', 'ui', 'i',
];

const JONG = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p',
  'l', 'm', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

/** 한글 음절을 로마자로 편다. 한글이 아닌 문자는 그대로 통과시킨다. */
export function romanizeKorean(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      out += CHO[Math.floor(offset / 588)];
      out += JUNG[Math.floor((offset % 588) / 28)];
      out += JONG[offset % 28];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * 임의 문자열 → URL 안전 슬러그.
 * 결과가 비면 빈 문자열을 돌려주므로, 호출부에서 대체값을 정해야 한다.
 */
export function slugify(input: string, maxLength = 40): string {
  return romanizeKorean(String(input || ''))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')  // 발음 구별 기호 제거 (é → e)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

/** 브랜드 주소로 쓸 수 없는 값 — 기존 경로와 충돌하거나 오인될 수 있는 것들 */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'seller', 'brand', 'brands', 'product', 'products',
  'my', 'chat', 'cart', 'checkout', 'search', 'shop', 'new', 'sale',
  'event', 'events', 'news', 'ranking', 'trend', 'recommend', 'snap',
  'discover', 'user', 'users', 'help', 'support', 'policy', 'login',
  'signup', 'logout', 'payment', 'orders', 'likes', 'category', 'cat',
  'promo', 'custom-order', 'handy', 'www', 'null', 'undefined',
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/;

/** 셀러가 직접 입력한 주소의 형식 검사. 통과하면 null, 아니면 사유 문자열. */
export function validateSlug(slug: string): string | null {
  if (!slug) return '주소를 입력해주세요.';
  if (slug.length < 2) return '주소는 2자 이상이어야 합니다.';
  if (slug.length > 40) return '주소는 40자 이하여야 합니다.';
  if (!SLUG_PATTERN.test(slug)) {
    return '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있으며 하이픈으로 시작하거나 끝날 수 없습니다.';
  }
  if (RESERVED_SLUGS.has(slug)) return '이미 사용 중인 주소입니다.';
  // UUID 조각으로 오인될 수 있는 순수 16진수 8자리는 막는다 (상품 링크 규칙과 충돌)
  if (/^[0-9a-f]{8}$/.test(slug)) return '사용할 수 없는 형식의 주소입니다.';
  return null;
}

/**
 * 상품 링크의 장식부 + 식별자. 예: "Blue Ribbon" → "blue-ribbon-f2f5655c"
 * 뒤 8자리는 productUuid 앞부분이라, 상품명을 바꿔도 기존 링크가 계속 열린다.
 */
export function buildProductUrlSlug(name: string, productUuid: string): string {
  const short = String(productUuid || '').replace(/-/g, '').slice(0, 8).toLowerCase();
  if (!short) return '';
  const base = slugify(name, 60);
  return base ? `${base}-${short}` : short;
}

/** 상품 링크 문자열에서 uuid 앞 8자리를 뽑아낸다. 실패 시 null. */
export function extractProductShortId(identifier: string): string | null {
  const m = String(identifier || '').toLowerCase().match(/([0-9a-f]{8})$/);
  return m ? m[1] : null;
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
