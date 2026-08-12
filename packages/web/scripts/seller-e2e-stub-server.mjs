import http from 'node:http';

const port = 11000;
let application = null;

const user = {
  id: 'user-uuid-e2e',
  userUuid: 'user-uuid-e2e',
  userId: 'user-e2e',
  email: 'seller-e2e@handy.local',
  name: '입점 테스트 사용자',
  nickname: '입점테스트',
  role: 'user',
  isActive: true,
};

function send(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3001',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});

  if (request.method === 'POST' && request.url === '/api/auth/login') {
    return send(response, 200, { success: true, token: 'local-e2e-token', user });
  }

  if (request.method === 'GET' && request.url === '/api/seller/application/status') {
    return send(response, 200, {
      success: true,
      data: application
        ? { exists: true, sellerInfoId: 'e2e-1', status: application.status, progress: application.status === 'pending' ? 100 : 0 }
        : { exists: false, status: 'not_started', progress: 0, isComplete: false },
    });
  }

  if (request.method === 'GET' && request.url === '/api/seller/application') {
    if (!application) return send(response, 404, { success: false, error: 'Seller application not found' });
    return send(response, 200, {
      success: true,
      data: { exists: true, sellerInfoId: 'e2e-1', status: application.status, application },
    });
  }

  if (request.method === 'PUT' && request.url === '/api/seller/application/draft') {
    application = { ...(await readBody(request)), status: 'draft' };
    return send(response, 200, {
      success: true,
      data: { exists: true, sellerInfoId: 'e2e-1', status: 'draft', progress: 0 },
    });
  }

  if (request.method === 'POST' && request.url === '/api/seller/application/submit') {
    application = { ...application, status: 'pending' };
    return send(response, 200, {
      success: true,
      data: { exists: true, sellerInfoId: 'e2e-1', status: 'pending', progress: 100, submittedAt: new Date().toISOString() },
    });
  }

  return send(response, 404, { success: false, error: 'E2E stub route not found' });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Seller E2E stub API listening on http://127.0.0.1:${port}`);
});
