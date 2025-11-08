import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Serverless Function is working!',
    path: req.url,
    method: req.method
  });
}
