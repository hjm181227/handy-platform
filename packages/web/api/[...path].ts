import { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/edge-config';

// Fallback API target URL
const FALLBACK_API_TARGET = 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Edge Config에서 API target 가져오기
    let apiTarget = FALLBACK_API_TARGET;

    try {
      const edgeConfigTarget = await get<string>('api_target');
      if (edgeConfigTarget) {
        apiTarget = edgeConfigTarget;
        console.log('[Edge Config] Using api_target:', apiTarget);
      } else {
        console.warn('[Edge Config] No api_target found, using fallback');
      }
    } catch (error) {
      console.error('[Edge Config] Failed to load api_target:', error);
      console.log('[Edge Config] Using fallback:', FALLBACK_API_TARGET);
    }

    // 요청 경로 구성 (/api/health -> /api/health)
    const path = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path || '';

    const apiPath = `/api/${path}`;

    // path를 제외한 나머지 쿼리 파라미터만 추출
    const queryParams = { ...req.query };
    delete queryParams.path;
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    const targetUrl = `${apiTarget}${apiPath}${queryString ? '?' + queryString : ''}`;

    console.log(`[Proxy] ${req.method} ${apiPath} -> ${targetUrl}`);

    // 백엔드로 요청 프록시
    const headers: HeadersInit = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Authorization 헤더 전달
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // 기타 필요한 헤더 전달
    if (req.headers['x-requested-with']) {
      headers['X-Requested-With'] = req.headers['x-requested-with'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // POST, PUT, PATCH 요청의 경우 body 전달
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    // 응답 헤더 복사
    response.headers.forEach((value, key) => {
      // CORS 관련 헤더는 Vercel이 자동 처리
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
      }
    });

    // 상태 코드와 응답 전달
    res.status(response.status);

    // JSON 응답 처리
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      // JSON이 아닌 경우 텍스트로 전달
      res.send(data);
    }
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}