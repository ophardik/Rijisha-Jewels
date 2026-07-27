import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import PasswordInput from '../components/PasswordInput';
import { toast } from '../toast';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function ResetPassword() {
  usePageTitle(STRINGS.titles.resetPassword);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  // 'checking' | 'valid' | 'invalid' — the link is verified before the form is
  // shown, so an expired link says so up front instead of after typing.
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    api(`/auth/reset-password/${encodeURIComponent(token)}`)
      .then(({ email }) => {
        setEmail(email);
        setStatus('valid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(STRINGS.resetPassword.mismatch);
      return;
    }
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      toast(STRINGS.resetPassword.done, 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <span className="section-eyebrow">{STRINGS.resetPassword.eyebrow}</span>

        {status === 'checking' && (
          <>
            <h2 className="serif">{STRINGS.resetPassword.title}</h2>
            <p className="auth-intro">{STRINGS.resetPassword.checking}</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h2 className="serif">{STRINGS.resetPassword.invalidTitle}</h2>
            <p className="auth-intro">{STRINGS.resetPassword.invalidText}</p>
            <p className="auth-switch"><Link to="/forgot-password">{STRINGS.resetPassword.requestAgain}</Link></p>
          </>
        )}

        {status === 'valid' && (
          <>
            <h2 className="serif">{STRINGS.resetPassword.title}</h2>
            <p className="auth-intro">{STRINGS.resetPassword.intro(email)}</p>
            <form onSubmit={submit} className="auth-form">
              <label>{STRINGS.resetPassword.password}<PasswordInput required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={STRINGS.resetPassword.passwordPlaceholder} /></label>
              <label>{STRINGS.resetPassword.confirm}<PasswordInput required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={STRINGS.resetPassword.confirmPlaceholder} /></label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-dark full" disabled={busy}>{busy ? STRINGS.resetPassword.busy : STRINGS.resetPassword.submit}</button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
