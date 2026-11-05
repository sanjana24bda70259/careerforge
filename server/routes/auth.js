import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '../models/User.js';
import { createToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { passwordResetEmailConfigured, sendPasswordResetEmail } from '../services/passwordResetEmail.js';

import oauthRoutes from './oauth.js';
const router = Router();
router.use('/oauth', oauthRoutes);
const normalizeEmail = email => typeof email === 'string' ? email.trim().toLowerCase() : '';
const emailValid = email => /^\S+@\S+\.\S+$/.test(email);
const duplicateEmail = res => res.status(409).json({ success: false, error: 'Email already registered', message: 'An account already exists for this email.' });
const userPayload = (user) => ({ id: user.id, email: user.email, role: user.role, profile: user.profile, onboardingCompleted: user.onboardingCompleted !== false });
const resetHash = token => createHash('sha256').update(token).digest('hex');
const resetOrigin = () => (process.env.PASSWORD_RESET_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

router.post('/register', async (req, res, next) => {
  try {
    const { password, name } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    if (!emailValid(email) || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Provide a valid email and a password of at least 8 characters.' });
    }
    if (name !== undefined && (typeof name !== 'string' || name.trim().length > 80)) return res.status(400).json({ success: false, message: 'Provide a name of at most 80 characters.' });
    if (await User.exists({ email })) return duplicateEmail(res);
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), profile: { name }, onboardingCompleted: false });
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

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    // Keep this response identical whether the account exists to avoid account enumeration.
    const message = 'If an account exists for that email, we’ll send a password-reset link shortly.';
    if (!emailValid(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (!passwordResetEmailConfigured()) return res.status(503).json({ success: false, message: 'Password reset email is temporarily unavailable. Please try again later.' });
    const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (user) {
      const token = randomBytes(32).toString('hex');
      user.passwordResetTokenHash = resetHash(token);
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      try {
        await sendPasswordResetEmail({ email: user.email, resetUrl: `${resetOrigin()}/reset-password?token=${encodeURIComponent(token)}` });
      } catch (error) {
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpiresAt = undefined;
        await user.save();
        throw error;
      }
    }
    res.json({ success: true, data: {}, message });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || token.length < 32 || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Use a valid reset link and a password of at least 8 characters.' });
    }
    const user = await User.findOne({ passwordResetTokenHash: resetHash(token), passwordResetExpiresAt: { $gt: new Date() } }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user) return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Request a new one.' });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    res.json({ success: true, data: {}, message: 'Password updated. You can now log in.' });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: userPayload(req.user) }, message: 'User retrieved successfully.' }));
export default router;
