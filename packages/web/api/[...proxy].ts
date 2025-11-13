import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - API 프록시
 *
 * 역할:
 * - Vercel SSL로 HTTPS 요청 수신
 * - Host 헤더 기반으로 백엔드 환경 결정
 * - AWS ALB로 HTTP 프록시 (내부 통신)
 *
 * 라우팅:
 * - api.h-andy.com → ALB:80 (프로덕션)
 * - api.stage-handy.com → ALB:8080 (스테이징)
 */

// AWS ALB 주소
const ALB_HOST = 'handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Host 헤더로 환경 판단
    const host = req.headers.host || '';
    const isProduction = host.includes('api.h-andy.com');
    const isStaging = host.includes('api.stage-handy.com');

    // 2. 백엔드 포트 결정
    let backendPort: number;
    let environment: string;

    if (isProduction) {
      backendPort = 80;
      environment = 'production';
    } else if (isStaging) {
      backendPort = 8080;
      environment = 'staging';
    } else {
      // 로컬 개발 또는 알 수 없는 호스트
      return res.status(400).json({
        error: 'Invalid host',
        message: `Host "${host}" is not recognized. Expected api.h-andy.com or api.stage-handy.com`,
      });
    }

    // 3. 백엔드 URL 구성
    const targetUrl = `http://${ALB_HOST}:${backendPort}${req.url}`;

    console.log(`[API Proxy] ${environment} | ${req.method} ${targetUrl}`);

    // 4. 요청 헤더 준비 (불필요한 헤더 제거)
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      // Vercel 관련 헤더 및 host 헤더 제외
      if (
        !key.startsWith('x-vercel-') &&
        key !== 'host' &&
        key !== 'connection' &&
        typeof value === 'string'
      ) {
        headers[key] = value;
      }
    });

    // 5. 백엔드로 요청 전송
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // 6. 백엔드 응답 헤더 복사
    response.headers.forEach((value, key) => {
      // CORS 및 보안 헤더는 백엔드에서 이미 설정됨
      res.setHeader(key, value);
    });

    // 7. 상태 코드 및 응답 바디 전달
    const contentType = response.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    res.status(response.status).send(responseBody);
  } catch (error) {
    console.error('[API Proxy Error]', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}