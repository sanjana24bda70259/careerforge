import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required', message: 'Authentication required.' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return next(error);
    return res.status(401).json({ success: false, error: 'Invalid session', message: 'Invalid or expired session.' });
  }
  try {
    req.user = await User.findById(payload.sub);
    if (!req.user) return res.status(401).json({ success: false, error: 'Account not found', message: 'Account no longer exists.' });
    next();
  } catch (error) {
    // Database failures must not invalidate an otherwise valid login.
    next(error);
  }
}
