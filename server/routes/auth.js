import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';

import oauthRoutes from './oauth.js';
const router = Router();
router.use('/oauth', oauthRoutes);
const normalizeEmail = email => typeof email === 'string' ? email.trim().toLowerCase() : '';
const emailValid = email => /^\S+@\S+\.\S+$/.test(email);
const duplicateEmail = res => res.status(409).json({ success: false, error: 'Email already registered', message: 'An account already exists for this email.' });
const userPayload = (user) => ({ id: user.id, email: user.email, role: user.role, profile: user.profile });

router.post('/register', async (req, res, next) => {
  try {
    const { password, name } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    if (!emailValid(email) || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Provide a valid email and a password of at least 8 characters.' });
    }
    if (name !== undefined && (typeof name !== 'string' || name.trim().length > 80)) return res.status(400).json({ success: false, message: 'Provide a name of at most 80 characters.' });
    if (await User.exists({ email })) return duplicateEmail(res);
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), profile: { name } });
    res.status(201).json({ success: true, data: { token: createToken(user), user: userPayload(user) }, message: 'Account created successfully.' });
  } catch (error) { if (error.code === 11000) return duplicateEmail(res); next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email), password = req.body?.password;
    if (!emailValid(email) || typeof password !== 'string' || !password.length) return res.status(400).json({ success: false, message: 'Provide a valid email and password.' });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect.' });
    res.json({ success: true, data: { token: createToken(user), user: userPayload(user) }, message: 'Signed in successfully.' });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: userPayload(req.user) }, message: 'User retrieved successfully.' }));
export default router;
