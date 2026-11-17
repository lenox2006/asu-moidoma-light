import React from 'react';

/** Логотип АСУ «Мои Дома» (перенесён из основной системы) */
const Logo = ({ width = 28, height = 29 }) => (
    <svg width={width} height={height} viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M14 0V6L8.97355 9.94737V24H14.5026V29H3.9471V13.7973C3.25411 14.1409 1.97276 14.5361 0.931223 13.5C-0.813439 11.7645 0.428578 10 0.428578 10L14 0Z" fill="#0065B0" />
        <path fillRule="evenodd" clipRule="evenodd" d="M14 0V6L19.0264 9.94736V19H24.0529V13.7973C24.7459 14.1409 26.0272 14.5361 27.0688 13.5C28.8134 11.7645 27.5714 10 27.5714 10L14 0Z" fill="#F5A162" />
        <path d="M14 29V19H24.0529L14 29Z" fill="#7C3F2E" />
    </svg>
);

export default Logo;
