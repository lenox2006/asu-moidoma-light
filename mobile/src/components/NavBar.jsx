import { useNavigate } from 'react-router-dom';
import { Back, Logo } from './Icons';

/** Навигационная панель: назад / заголовок + подзаголовок / действие справа; children — поиск, сегменты. */
export default function NavBar({ title, subtitle, back, onBack, brand = false, right = null, children }) {
  const navigate = useNavigate();
  return (
    <header className="navbar">
      <div className="navbar-row">
        {back ? (
          <button type="button" className="navbar-back" aria-label="Назад" onClick={() => (onBack ? onBack() : (typeof back === 'string' ? navigate(back) : navigate(-1)))}>
            <Back />
          </button>
        ) : null}
        {brand ? <Logo size={26} /> : null}
        <div className="navbar-titles">
          <div className={`navbar-title${brand ? ' accent' : ''}`}>{title}</div>
          {subtitle ? <div className="navbar-sub">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </header>
  );
}
