import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Chevron, Plus } from '../components/Icons';
import NavBar from '../components/NavBar';
import { EmptyState, ErrorCard, Loading } from '../components/States';
import TabBar from '../components/TabBar';
import { useAuth } from '../lib/auth';

const initials = (name) => (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function UsersPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.users().then((d) => setUsers(Array.isArray(d) ? d : d.data || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const scope = (u) => {
    if (u.role === 'superadmin') return 'все регионы';
    const r = (u.regions || []).map((x) => x.name || x.id);
    const k = (u.uks || []).map((x) => x.name || `#${x.id}`);
    return [r.join(', ') || 'нет региона', k.length ? k.join(', ') : 'все УК'].join(' · ');
  };

  return (
    <div className="screen">
      <NavBar title="Пользователи" subtitle={`Учётные записи${loading ? '' : ` · ${users.length}`}`} right={<button type="button" className="icon-btn filled" aria-label="Добавить пользователя" onClick={() => navigate('/users/new')}><Plus /></button>} />
      <main className="screen-scroll has-tabbar">
        {error ? <ErrorCard message={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && !error && users.length === 0 ? <EmptyState title="Пользователей нет" text="" /> : null}
        {users.map((u) => (
          <button type="button" className="row" key={u.id} onClick={() => navigate(`/users/${u.id}`)}>
            <div className="avatar">{initials(u.name)}</div>
            <div className="row-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="row-title">{u.name}{u.id === me?.id ? ' (вы)' : ''}</span>
                {u.role === 'superadmin' ? <span className="tag accent">superadmin</span> : u.is_active ? <span className="tag ok">активен</span> : <span className="tag muted">отключён</span>}
              </div>
              <div className="row-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.login} · {scope(u)}</div>
            </div>
            <span className="chev"><Chevron /></span>
          </button>
        ))}
      </main>
      <TabBar />
    </div>
  );
}
