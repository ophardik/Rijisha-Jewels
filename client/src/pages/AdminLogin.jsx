import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { toast } from '../toast';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function AdminLogin() {
  usePageTitle(STRINGS.titles.adminLogin);
  const { adminLogin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await adminLogin(email, password);
      toast(STRINGS.common.welcomeBack(user.name.split(' ')[0]), 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="section"><Loader /></section>;
  // Already signed in (or just signed in) — admins land on the home page,
  // same as customers; the panel is reachable via the Admin link in the header.
  if (user?.isAdmin) return <Navigate to="/" replace />;

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <span className="section-eyebrow">{STRINGS.adminLogin.eyebrow}</span>
        <h2 className="serif">{STRINGS.adminLogin.title}</h2>
        <form onSubmit={submit} className="auth-form">
          <label>{STRINGS.adminLogin.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={STRINGS.adminLogin.emailPlaceholder} /></label>
          <label>{STRINGS.login.password}<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={STRINGS.adminLogin.passwordPlaceholder} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark full" disabled={busy}>{busy ? STRINGS.login.busy : STRINGS.adminLogin.submit}</button>
        </form>
        <p className="auth-switch muted">{STRINGS.adminLogin.note}</p>
      </div>
    </section>
  );
}
