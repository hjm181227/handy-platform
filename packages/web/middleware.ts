/**
 * Vercel Edge Middleware — SNS 크롤러용 상품 OG 태그.
 *
 * 배경: Vite SPA라 상품·브랜드 페이지의 공유 미리보기가 사이트 공통 카드로
 * 고정돼 나갔다. 카카오톡·페이스북 등의 스크래퍼는 JS를 실행하지 않으므로,
 * 크롤러 UA에 한해 엣지에서 정보를 조회해 OG 메타태그가 포함된 HTML을
 * 반환한다. 일반 사용자는 그대로 SPA 응답.
 */

export const config = {
  matcher: ['/product/:path*', '/brand/:path*']
};

const BOT_UA_PATTERN = /kakaotalk-scrap|facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|whatsapp|linkedinbot|pinterest|line-poker|skypeuripreview|naver|yeti|daum|kakaostory/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_UA_PATTERN.test(userAgent)) {
    return undefined; // 일반 사용자 → SPA로 계속 진행
  }

  const url = new URL(request.url);
  const [, section, rawIdentifier] = url.pathname.split('/');
  const identifier = rawIdentifier ? decodeURIComponent(rawIdentifier) : '';
  if (!identifier) return undefined;
  // 하위 경로(/product/x/custom-order 등)는 전용 카드를 만들지 않는다
  if (url.pathname.split('/').length > 3) return undefined;

  const apiBase = url.hostname.includes('stage')
    ? 'https://api.stage-handy.com'
    : 'https://api.h-andy.com';

  const isBrand = section === 'brand';
  const endpoint = isBrand
    ? `${apiBase}/api/brands/${encodeURIComponent(identifier)}`
    : `${apiBase}/api/products/${encodeURIComponent(identifier)}`;

  try {
    const apiResponse = await fetch(endpoint, {
      headers: { accept: 'application/json' }
    });
    if (!apiResponse.ok) return undefined;

    const json: any = await apiResponse.json();

    let title = '';
    let description = '';
    let image = '';
    let ogType = 'product';

    if (isBrand) {
      const brand = json?.data || json?.brand;
      if (!brand?.brandName) return undefined;
      ogType = 'website';
      title = escapeHtml(String(brand.brandName));
      const productCount = typeof brand.totalProducts === 'number' ? `상품 ${brand.totalProducts}개` : '';
      description = escapeHtml(
        [productCount, String(brand.description || '').slice(0, 120)].filter(Boolean).join(' · ')
          || `HANDY에서 ${brand.brandName}의 네일 상품을 만나보세요`
      );
      const brandImage = brand.brandBanner || brand.brandProfile || '';
      image = brandImage ? escapeHtml(String(brandImage)) : '';
    } else {
      const product = json?.data?.product || json?.data || json?.product;
      if (!product?.name) return undefined;
      title = escapeHtml(String(product.name));
      const rawDescription = product.shortDescription || product.description || '';
      const price = typeof product.price === 'number' ? `${product.price.toLocaleString('ko-KR')}원` : '';
      description = escapeHtml(
        [price, String(rawDescription).slice(0, 120)].filter(Boolean).join(' · ') || 'HANDY에서 네일 상품을 만나보세요'
      );
      image = product.mainImageUrl ? escapeHtml(String(product.mainImageUrl)) : '';
    }

    const pageUrl = escapeHtml(`${url.origin}${url.pathname}`);

    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title} | HANDY</title>
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="HANDY">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
${image ? `<meta property="og:image" content="${image}">` : ''}
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
${image ? `<meta name="twitter:image" content="${image}">` : ''}
<meta name="description" content="${description}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<a href="${pageUrl}">상품 보러가기</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=600'
      }
    });
  } catch {
    return undefined; // 실패 시 SPA로 폴백
  }
}
