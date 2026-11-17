import { useNavigate } from 'react-router-dom';
import { Logout } from '../components/Icons';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import { useAuth } from '../lib/auth';
import { clearCrumbs } from '../lib/crumbs';

const initials = (name) => (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function ProfilePage() {
  const { user, isSuperadmin, logout } = useAuth();
  const navigate = useNavigate();
  const regions = (user?.regions || []).map((r) => r.name || r.id);
  const uks = (user?.uks || []).map((u) => u.name || `#${u.id}`);

  async function onLogout() {
    await logout();
    clearCrumbs();
    navigate('/login', { replace: true });
  }

  return (
    <div className="screen">
      <NavBar title="Профиль" subtitle="Текущая учётная запись" />
      <main className="screen-scroll has-tabbar" style={{ gap: 14 }}>
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '20px 16px' }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials(user?.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{user?.login} · {isSuperadmin ? 'superadmin' : 'пользователь'}</div>
          </div>
        </div>
        <div className="menu-list">
          <div className="kv"><span>Регионы</span><b>{isSuperadmin ? 'Все' : regions.join(', ') || '—'}</b></div>
          <div className="kv"><span>Управляющие компании</span><b>{isSuperadmin ? 'Все' : uks.join(', ') || 'Все УК регионов'}</b></div>
        </div>
        <div className="menu-list">
          <button type="button" className="menu-item danger" onClick={onLogout}><Logout /><span style={{ flex: 1 }}>Выйти</span></button>
        </div>
        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>АСУ «Мои Дома» Light · мобильная версия 1.0</div>
      </main>
      <TabBar />
    </div>
  );
}
