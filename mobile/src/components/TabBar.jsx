import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Home, Person, Users } from './Icons';

export default function TabBar() {
  const { isSuperadmin } = useAuth();
  const cls = ({ isActive }) => (isActive ? 'active' : '');
  return (
    <nav className="tabbar" aria-label="Основная навигация">
      <NavLink to="/houses" className={cls}><Home />Дома</NavLink>
      {isSuperadmin ? <NavLink to="/users" className={cls}><Users />Пользователи</NavLink> : null}
      <NavLink to="/profile" className={cls}><Person />Профиль</NavLink>
    </nav>
  );
}
