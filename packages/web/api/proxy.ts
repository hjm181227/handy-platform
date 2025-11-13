import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - API Proxy (CORS 완전 지원)
 *
 * 클라이언트 요청을 백엔드 ALB로 프록시합니다.
 * ALB URL은 서버사이드에만 존재하여 보안을 유지합니다.
 *
 * 환경별 자동 라우팅:
 * - Production (main branch): Port 80
 * - Preview/Staging (develop branch): Port 8080
 *
 * CORS 지원:
 * - OPTIONS preflight 처리
 * - 동적 Origin 설정
 * - Credentials 지원
 */

const ALB_BASE_URL = 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com';

// 허용된 Origin 목록 (보안 강화)
const ALLOWED_ORIGINS = [
  'https://h-andy.com',
  'https://www.h-andy.com',
  'https://stage-handy.com',
  'https://www.stage-handy.com',
  'http://localhost:3001', // 로컬 개발
  'http://localhost:11000', // 로컬 백엔드
];

// CORS 헤더 설정 함수
function setCorsHeaders(res: VercelResponse, origin?: string) {
  // Origin 검증 및 동적 설정
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // 허용되지 않은 Origin → Wildcard (Credentials 없음)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24시간 캐싱
}

// 환경별 포트 설정
function getBackendUrl(): string {
  const env = process.env.VERCEL_ENV || 'development';

  if (env === 'production') {
    return `${ALB_BASE_URL}:80`;
  } else {
    // preview, development 모두 staging 포트 사용
    return `${ALB_BASE_URL}:8080`;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const origin = req.headers.origin;

  // OPTIONS preflight 요청 처리 (CORS 필수)
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    res.status(200).end();
    return;
  }

  try {
    // API 경로 추출
    const { path = [] } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;

    // 쿼리 파라미터 처리
    const queryParams = { ...req.query };
    delete queryParams.path;
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();

    // 타겟 URL 구성
    const backendUrl = getBackendUrl();
    const targetUrl = `${backendUrl}/api/${apiPath}${queryString ? '?' + queryString : ''}`;

    console.log(`[Proxy][${process.env.VERCEL_ENV}] ${req.method} /api/${apiPath} → ${targetUrl}`);

    // 요청 헤더 준비 - 백엔드가 요구하는 모든 헤더 전달
    const headers: HeadersInit = {};

    // 백엔드 CORS allowedHeaders에 명시된 필수 헤더들
    const allowedHeaders = [
      'content-type',      // 요청 형식
      'authorization',     // JWT 토큰
      'accept',            // 응답 형식 지정
      'origin',            // CORS 정책
      'x-requested-with',  // AJAX 식별 (CSRF 방어)
      'user-agent',        // React Native 앱 식별
    ];

    // 추가로 전달할 헤더들
    const optionalHeaders = [
      'cookie',            // 세션 인증 (OAuth용)
      'accept-language',   // 다국어 지원
      'accept-encoding',   // 압축 지원
      'referer',           // 요청 출처
    ];

    // 모든 헤더 복사
    [...allowedHeaders, ...optionalHeaders].forEach(header => {
      const value = req.headers[header.toLowerCase()];
      if (value) {
        // HTTP 헤더 표준 형식으로 변환
        const headerName = header.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('-');
        headers[headerName] = value as string;
      }
    });

    // Vercel이 제공하는 클라이언트 IP 전달
    const clientIp = req.headers['x-forwarded-for'] ||
                     req.headers['x-real-ip'] ||
                     'unknown';
    headers['X-Forwarded-For'] = clientIp as string;
    headers['X-Real-IP'] = clientIp as string;

    // 프록시 식별 헤더 추가 (디버깅용)
    headers['X-Proxied-By'] = 'Vercel-Serverless-Function';

    // 백엔드로 프록시 요청
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? JSON.stringify(req.body)
        : undefined,
    });

    // 응답 데이터 처리
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // CORS 헤더 먼저 설정
    setCorsHeaders(res, origin);

    // 백엔드 응답 헤더 복사 (CORS 헤더 제외 - 이미 설정함)
    const excludedResponseHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials',
      'access-control-max-age',
    ];

    response.headers.forEach((value: string, key: string) => {
      if (!excludedResponseHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // 클라이언트에 응답
    res.status(response.status).send(data);

  } catch (error: any) {
    console.error('[Proxy] Error:', error);

    // 에러 응답에도 CORS 헤더 설정 (중요!)
    setCorsHeaders(res, origin);

    res.status(500).json({
      error: 'Proxy failed',
      message: error.message,
      env: process.env.VERCEL_ENV,
    });
  }
}
