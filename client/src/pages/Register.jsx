import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function Register() {
  usePageTitle(STRINGS.titles.register);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(name, email, password);
      toast(STRINGS.register.welcome(user.name.split(' ')[0]), 'success');
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
        <span className="section-eyebrow">{STRINGS.register.eyebrow}</span>
        <h2 className="serif">{STRINGS.register.title}</h2>
        <form onSubmit={submit} className="auth-form">
          <label>{STRINGS.register.name}<input required value={name} onChange={(e) => setName(e.target.value)} placeholder={STRINGS.register.namePlaceholder} /></label>
          <label>{STRINGS.login.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={STRINGS.login.emailPlaceholder} /></label>
          <label>{STRINGS.login.password}<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={STRINGS.register.passwordPlaceholder} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark full" disabled={busy}>{busy ? STRINGS.register.busy : STRINGS.register.title}</button>
        </form>
        <p className="auth-switch">
          {STRINGS.register.switchText} <Link to={`/login${params.get('next') ? `?next=${params.get('next')}` : ''}`}>{STRINGS.register.switchLink}</Link>
        </p>
      </div>
    </section>
  );
}
