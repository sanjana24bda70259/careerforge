import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

const COOLDOWN_SECONDS = 60;
const emailPattern = /^\S+@\S+\.\S+$/;

function Spinner() { return <span className="password-reset-spinner" aria-hidden="true" />; }

function strengthFor(password) {
  const checks = [password.length >= 8, /[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  return { score, label: score < 3 ? 'Weak' : score < 5 ? 'Good' : 'Strong', checks };
}

export function PasswordResetForm({ mode }) {
  const requestMode = mode === 'forgot-password';
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const strength = useMemo(() => strengthFor(password), [password]);
  const token = new URLSearchParams(location.search).get('token') || '';

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    const interval = window.setInterval(() => setCooldown(current => {
      if (current <= 1) { window.clearInterval(interval); return 0; }
      return current - 1;
    }), 1000);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setStatus({ type: '', message: '' });
    if (requestMode && !emailPattern.test(email.trim())) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }
    if (!requestMode) {
      if (!token) { setStatus({ type: 'error', message: 'This reset link is incomplete. Request a new link.' }); return; }
      if (password.length < 8) { setStatus({ type: 'error', message: 'Your new password must contain at least 8 characters.' }); return; }
      if (password !== confirmPassword) { setStatus({ type: 'error', message: 'The passwords do not match.' }); return; }
    }
    setSubmitting(true);
    try {
      if (requestMode) {
        await api.forgotPassword({ email: email.trim() });
        setStatus({ type: 'success', message: 'If an account uses this email, a reset link is on its way. Check your inbox and spam folder.' });
        startCooldown();
      } else {
        await api.resetPassword({ token, password });
        setStatus({ type: 'success', message: 'Your password has been updated. Redirecting you to login...' });
        window.setTimeout(() => navigate('/login', { replace: true }), 1100);
      }
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setSubmitting(false); }
  }

  return <section className="password-reset-card" id="account-access" aria-labelledby="password-reset-title">
    <span className="password-reset-eyebrow">ACCOUNT SECURITY</span>
    <h1 id="password-reset-title">{requestMode ? 'Reset your password' : 'Choose a new password'}</h1>
    <p className="password-reset-intro">{requestMode ? 'Enter your email and we will send a secure reset link if an account is registered to it.' : 'Create a new password to restore access to your CareerForge workspace.'}</p>
    <form onSubmit={submit} noValidate>
      {requestMode ? <label className="password-reset-field">Email address<input name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" disabled={submitting} /></label> : <>
        <label className="password-reset-field">New password<span className="password-reset-input"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength="8" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" disabled={submitting} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide new password' : 'Show new password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
        <div className="password-strength" aria-live="polite"><div className={`password-strength-meter level-${strength.score}`}><span /><span /><span /><span /><span /></div><p>Password strength: <b>{strength.label}</b></p></div>
        <p className="password-reset-help">Use 8 or more characters. A mix of uppercase, lowercase, numbers and symbols makes it stronger.</p>
        <label className="password-reset-field">Confirm new password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength="8" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Re-enter your new password" disabled={submitting} /></label>
      </>}
      {status.message && <p className={`password-reset-message ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
      <button className="password-reset-submit" disabled={submitting || (requestMode && cooldown > 0)}>{submitting && <Spinner />}{submitting ? 'Please wait...' : requestMode && cooldown > 0 ? `Resend available in ${cooldown}s` : requestMode ? 'Email reset link' : 'Update password'}</button>
    </form>
    {requestMode && cooldown > 0 && <p className="password-reset-resend">Need another email? You can request a new reset link when the timer ends.</p>}
    <p className="password-reset-back"><Link to="/login">Back to login</Link></p>
  </section>;
}
