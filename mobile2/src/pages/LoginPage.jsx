import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Icons';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ login: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/houses'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.login.trim(), form.password);
      navigate(location.state?.from || '/houses', { replace: true });
    } catch (err) {
      setError((err.errors && Object.values(err.errors).flat()[0]) || err.message || 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-logo"><Logo size={96} /></div>
      <div className="login-title">Мои Дома</div>
      <div className="login-sub">АСУ «Мои Дома» Light</div>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="login">Логин</label>
          <input id="login" type="text" autoComplete="username" autoCapitalize="none" placeholder="Введите логин" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Введите пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 48 }} />
            <button type="button" className="icon-btn plain" style={{ position: 'absolute', right: 2, color: '#8a93a0' }} aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShow((v) => !v)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{show ? <path d="M4 4l16 16" /> : null}</svg>
            </button>
          </div>
        </div>
        {error ? <div className="error-card" role="alert"><div className="error-text" style={{ marginTop: 0 }}>{error}</div></div> : null}
        <button type="submit" className="btn" style={{ marginTop: 6, height: 52 }} disabled={busy}>{busy ? 'Вход…' : 'Войти'}</button>
      </form>
      <div className="login-foot">Учётные записи выдаёт администратор сервиса.<br />Версия 1.0</div>
    </div>
  );
}
