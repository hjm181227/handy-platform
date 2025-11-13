import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - API Proxy
 *
 * 클라이언트 요청을 백엔드 ALB로 프록시합니다.
 * ALB URL은 서버사이드에만 존재하여 보안을 유지합니다.
 *
 * 환경별 자동 라우팅:
 * - Production (main branch): Port 80
 * - Preview/Staging (develop branch): Port 8080
 */

const ALB_BASE_URL = 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com';

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

    // 요청 헤더 준비
    const headers: HeadersInit = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Authorization 헤더 전달
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

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

    // 응답 헤더 복사
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // CORS 헤더 추가
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    // 클라이언트에 응답
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(data);

  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: 'Proxy failed',
      message: error.message,
      env: process.env.VERCEL_ENV,
    });
  }
}
