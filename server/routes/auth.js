import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const emailValid = (email) => /^\S+@\S+\.\S+$/.test(email || '');
const userPayload = (user) => ({ id: user.id, email: user.email, role: user.role, profile: user.profile });

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!emailValid(email) || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Provide a valid email and a password of at least 8 characters.' });
    }
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ success: false, error: 'Email already registered', message: 'An account already exists for this email.' });
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), profile: { name } });
    res.status(201).json({ success: true, data: { token: createToken(user), user: userPayload(user) }, message: 'Account created successfully.' });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect.' });
    res.json({ success: true, data: { token: createToken(user), user: userPayload(user) }, message: 'Signed in successfully.' });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: userPayload(req.user) }, message: 'User retrieved successfully.' }));
export default router;
