import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { saveSession } from '../services/session.js';
import '../authEnhancements.css';

export function AuthForm({ mode = 'login', setUser }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptedTerms: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    let current = true;
    fetch('/api/auth/oauth/providers').then(r => r.json()).then(result => { if(current && result.success) setProviders(result.data.providers); }).catch(() => {});
    const params = new URLSearchParams(location.search);
    if(params.get('oauth_error')) setError(params.get('oauth_error'));
    if(params.get('oauth_complete') === '1') {
      window.history.replaceState(null, '', location.pathname);
      fetch('/api/auth/oauth/complete', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async r=>{const result=await r.json();if(!r.ok||!result.success)throw Error(result.message||'Sign-in failed.');return result.data;}).then(data=>{saveSession(data);setUser(data.user);navigate('/dashboard',{replace:true});}).catch(e=>setError(e.message));
    }
    return()=>{current=false;};
  }, []);
  const isRegister = mode === 'register';
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (isRegister && form.password !== form.confirmPassword) return setError('Your passwords do not match.');
    if (isRegister && !form.acceptedTerms) return setError('Please accept the Terms of Service and Privacy Policy to continue.');
    setError(''); setSubmitting(true);
    try {
      const payload = isRegister ? { name: form.name, email: form.email, password: form.password } : { email: form.email, password: form.password };
      const data = await (isRegister ? api.register(payload) : api.login(payload));
      saveSession(data); setUser(data.user);
      const from = location.state?.from;
      const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/', '/login', '/register'].includes(from.split(/[?#]/)[0]) ? from : '/dashboard';
      navigate(isRegister || data.user?.onboardingCompleted === false ? '/onboarding' : destination, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  return <section className="home-account" id="account-access" aria-labelledby="account-title">
    <div className="home-account-top"><span><i /> YOUR PREPARATION SPACE</span><span>Let’s begin </span></div>
    <nav className="home-account-tabs" aria-label="Account access"><Link to="/login" state={location.state} aria-current={!isRegister ? 'page' : undefined}>Login</Link><Link to="/register" state={location.state} aria-current={isRegister ? 'page' : undefined}>Sign up</Link></nav>
    <h2 id="account-title">{isRegister ? 'Create a free account' : 'Welcome back'}</h2>
    <p>{isRegister ? 'Your next chapter starts with one small step.' : 'Log in and pick up where you left off.'}</p>
    <div className="social-signin" aria-label="Social sign-in">{['google','github'].map(id => { const enabled=providers.some(p=>p.id===id&&p.enabled);return <button type="button" key={id} className={`social-${id}`} disabled={!enabled} title={enabled ? undefined : 'Provider setup required'} onClick={()=>{window.location.assign('/api/auth/oauth/'+id+'/start');}}><ProviderIcon provider={id} />{isRegister ? 'Sign up' : 'Log in'} with {id==='google'?'Google':'GitHub'}</button>; })}</div>
    {providers.length > 0 && providers.some(p=>!p.enabled) && <p className="social-setup">Social sign-in will be available once the providers are connected.</p>}
    <div className="signin-divider">or use your email</div>
    <form onSubmit={submit}>
      {isRegister && <label>Your name<input name="name" autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="What should we call you?" /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
      <div className="home-password-field"><label htmlFor="account-password">Password</label><span className="home-password"><input id="account-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={isRegister ? 'Create a password (8+ characters)' : 'Enter your password'} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button></span></div>
      {isRegister && <><div className="auth-password-strength" aria-live="polite"><span>Password strength</span><i className={`strength-${passwordStrength(form.password)}`}><b /><b /><b /><b /></i><small>{strengthLabel(form.password)}</small></div><label>Confirm password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat your password" /></label><label className="auth-terms"><input type="checkbox" checked={form.acceptedTerms} onChange={e => setForm({ ...form, acceptedTerms: e.target.checked })} /> <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label></>}
      {error && <p className="home-account-error" role="alert">{error}</p>}
      <button className="home-button home-account-submit" disabled={submitting}>{submitting ? 'One moment…' : isRegister ? 'Sign up' : 'Log in'}<span></span></button>
    </form>
    <p className="home-account-switch">{isRegister ? 'Already have an account?' : 'New to CareerForge?'} <Link to={isRegister ? '/login' : '/register'} state={location.state}>{isRegister ? 'Login' : 'Create an account'}</Link></p>{!isRegister && <p className="home-account-switch"><Link to="/forgot-password">Forgot password?</Link></p>}
    <div className="home-account-foot"><span>✓ One account for every learning path</span><span>✓ Pick up where you left off</span></div>
  </section>;
}

function passwordStrength(password) {
  if (!password) return 0;
  return Math.min(4, Number(password.length >= 8) + Number(/[a-z]/.test(password) && /[A-Z]/.test(password)) + Number(/\d/.test(password)) + Number(/[^\w\s]/.test(password)));
}
function strengthLabel(password) { return ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength(password)] || ''; }

function ProviderIcon({provider}) {return provider==='google'? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.6a4.8 4.8 0 0 1-2.1 3.2v2.7h3.4c2-1.8 3.1-4.5 3.1-7.9Z"/><path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.7a6.3 6.3 0 0 1-9.4-3.3H2.6v2.8A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.1 13.5a6 6 0 0 1 0-3.8V6.9H2.6a10 10 0 0 0 0 9.4Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l3-3A10 10 0 0 0 2.6 6.9l3.5 2.8A6 6 0 0 1 12 6Z"/></svg>:<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8a11.2 11.2 0 0 0-3.5 21.9c.6.1.8-.2.8-.5v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.3-3.2c-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.6 11.6 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.2c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.1c0 .3.2.6.8.5A11.2 11.2 0 0 0 12 .8Z"/></svg>;}
