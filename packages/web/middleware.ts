/**
 * Vercel Edge Middleware — SNS 크롤러용 상품 OG 태그.
 *
 * 배경: Vite SPA라 모든 상품 페이지의 공유 미리보기가 "상품 상세" 고정
 * 제목에 썸네일 없음으로 나갔다. 카카오톡·페이스북 등의 스크래퍼는 JS를
 * 실행하지 않으므로, 크롤러 UA에 한해 엣지에서 상품 정보를 조회해
 * OG 메타태그가 포함된 HTML을 반환한다. 일반 사용자는 그대로 SPA 응답.
 */

export const config = {
  matcher: '/product/:path*'
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
  const productUuid = url.pathname.split('/')[2];
  if (!productUuid) return undefined;

  const apiBase = url.hostname.includes('stage')
    ? 'https://api.stage-handy.com'
    : 'https://api.h-andy.com';

  try {
    const apiResponse = await fetch(`${apiBase}/api/products/${encodeURIComponent(productUuid)}`, {
      headers: { accept: 'application/json' }
    });
    if (!apiResponse.ok) return undefined;

    const json: any = await apiResponse.json();
    const product = json?.data?.product || json?.data || json?.product;
    if (!product?.name) return undefined;

    const title = escapeHtml(String(product.name));
    const rawDescription = product.shortDescription || product.description || '';
    const price = typeof product.price === 'number' ? `${product.price.toLocaleString('ko-KR')}원` : '';
    const description = escapeHtml(
      [price, String(rawDescription).slice(0, 120)].filter(Boolean).join(' · ') || 'HANDY에서 네일 상품을 만나보세요'
    );
    const image = product.mainImageUrl ? escapeHtml(String(product.mainImageUrl)) : '';
    const pageUrl = escapeHtml(`${url.origin}${url.pathname}`);

    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title} | HANDY</title>
<meta property="og:type" content="product">
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
