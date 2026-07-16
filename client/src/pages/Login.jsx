import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function Login() {
  usePageTitle(STRINGS.titles.login);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      toast(STRINGS.common.welcomeBack(user.name.split(' ')[0]), 'success');
      navigate(params.get('next') || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <span className="section-eyebrow">{STRINGS.login.eyebrow}</span>
        <h2 className="serif">{STRINGS.login.title}</h2>
        <form onSubmit={submit} className="auth-form">
          <label>{STRINGS.login.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={STRINGS.login.emailPlaceholder} /></label>
          <label>{STRINGS.login.password}<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={STRINGS.login.passwordPlaceholder} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark full" disabled={busy}>{busy ? STRINGS.login.busy : STRINGS.login.title}</button>
        </form>
        <p className="auth-switch">
          {STRINGS.login.switchText} <Link to={`/register${params.get('next') ? `?next=${params.get('next')}` : ''}`}>{STRINGS.login.switchLink}</Link>
        </p>
      </div>
    </section>
  );
}
