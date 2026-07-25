import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function ForgotPassword() {
  usePageTitle(STRINGS.titles.forgotPassword);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      // The API answers the same way whether or not the address has an account,
      // and so does this screen — no "no such user" to probe with.
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <span className="section-eyebrow">{STRINGS.forgotPassword.eyebrow}</span>
        {sent ? (
          <>
            <h2 className="serif">{STRINGS.forgotPassword.sentTitle}</h2>
            <p className="auth-intro">{STRINGS.forgotPassword.sentText(email)}</p>
            <p className="auth-intro">{STRINGS.forgotPassword.sentHint}</p>
            <p className="auth-switch"><Link to="/login">{STRINGS.forgotPassword.backToLogin}</Link></p>
          </>
        ) : (
          <>
            <h2 className="serif">{STRINGS.forgotPassword.title}</h2>
            <p className="auth-intro">{STRINGS.forgotPassword.intro}</p>
            <form onSubmit={submit} className="auth-form">
              <label>{STRINGS.login.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={STRINGS.login.emailPlaceholder} /></label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-dark full" disabled={busy}>{busy ? STRINGS.forgotPassword.busy : STRINGS.forgotPassword.submit}</button>
            </form>
            <p className="auth-switch"><Link to="/login">{STRINGS.forgotPassword.backToLogin}</Link></p>
          </>
        )}
      </div>
    </section>
  );
}
