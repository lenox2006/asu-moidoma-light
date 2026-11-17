import { Search } from './Icons';

export default function SearchField({ value, onChange, placeholder = 'Поиск', label = 'Поиск' }) {
  return (
    <div className="search">
      <label htmlFor="search" className="sr-only">{label}</label>
      <input id="search" type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      <Search />
    </div>
  );
}
