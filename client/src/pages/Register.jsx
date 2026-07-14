import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';

export default function Register() {
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
      toast(`Welcome to Rijisha, ${user.name.split(' ')[0]}!`);
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
        <span className="section-eyebrow">Join Us</span>
        <h2 className="serif">Create Account</h2>
        <form onSubmit={submit} className="auth-form">
          <label>Full Name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark full" disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to={`/login${params.get('next') ? `?next=${params.get('next')}` : ''}`}>Log in</Link>
        </p>
      </div>
    </section>
  );
}
