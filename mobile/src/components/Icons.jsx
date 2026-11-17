const b = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const Logo = ({ size = 28 }) => (
  <svg width={size} height={size * 29 / 28} viewBox="0 0 28 29" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M14 0V6L8.97355 9.94737V24H14.5026V29H3.9471V13.7973C3.25411 14.1409 1.97276 14.5361 0.931223 13.5C-0.813439 11.7645 0.428578 10 0.428578 10L14 0Z" fill="#0065B0" />
    <path fillRule="evenodd" clipRule="evenodd" d="M14 0V6L19.0264 9.94736V19H24.0529V13.7973C24.7459 14.1409 26.0272 14.5361 27.0688 13.5C28.8134 11.7645 27.5714 10 27.5714 10L14 0Z" fill="#F5A162" />
    <path d="M14 29V19H24.0529L14 29Z" fill="#7C3F2E" />
  </svg>
);
export const Back = () => <svg {...b} width={26} height={26} strokeWidth={2.2}><path d="M15 5l-7 7 7 7" /></svg>;
export const Chevron = () => <svg {...b} width={20} height={20} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>;
export const Search = () => <svg {...b} width={20} height={20} stroke="#20a0ff"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const Export = () => <svg {...b} width={22} height={22}><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M4 20h16" /></svg>;
export const Filter = () => <svg {...b} width={22} height={22}><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>;
export const Plus = () => <svg {...b} width={22} height={22} strokeWidth={2.2}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
export const Close = () => <svg {...b} width={14} height={14} strokeWidth={2.4}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
export const Check = () => <svg {...b} width={22} height={22} stroke="#20a0ff" strokeWidth={2.4}><path d="M5 12l5 5L20 7" /></svg>;
export const Home = () => <svg {...b}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>;
export const Users = () => <svg {...b}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c3 0 5.5 2 5.5 5" /></svg>;
export const Person = () => <svg {...b}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>;
export const Logout = () => <svg {...b} width={22} height={22}><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9" /></svg>;
export const Alert = () => <svg {...b} stroke="#c0392b"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>;
export const Empty = () => <svg {...b} width={48} height={48} stroke="#9fb3c6" strokeWidth={1.5}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /><path d="M8 11h6" /></svg>;
