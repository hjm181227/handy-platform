import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Simple Handler] Request received:', req.method, req.url);

  res.status(200).json({
    success: true,
    message: 'Simple handler works!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}
