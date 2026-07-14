import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { toast } from '../toast';

export default function AdminLogin() {
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
      toast(`Welcome back, ${user.name.split(' ')[0]}!`);
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
        <span className="section-eyebrow">Store Management</span>
        <h2 className="serif">Admin Login</h2>
        <form onSubmit={submit} className="auth-form">
          <label>Admin Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rijisha.com" /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark full" disabled={busy}>{busy ? 'Logging in…' : 'Log In as Admin'}</button>
        </form>
        <p className="auth-switch muted">This portal is for store administrators only.</p>
      </div>
    </section>
  );
}
