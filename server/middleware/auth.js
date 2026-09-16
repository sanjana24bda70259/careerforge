import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required', message: 'Authentication required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
    if (!req.user) return res.status(401).json({ success: false, error: 'Account not found', message: 'Account no longer exists.' });
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid session', message: 'Invalid or expired session.' });
  }
}
