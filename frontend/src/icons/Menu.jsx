import { createSvgIcon } from '@mui/material';
import React from 'react';

const OpenMenuIcon = createSvgIcon(
    <path
        d="M20.8 8.8L15.2 8.8M15.2 8.8V3.2M15.2 8.8L21.6 2.4M8.79999 20.8L8.79999 15.2M8.79999 15.2L3.19999 15.2M8.79999 15.2L2.39999 21.6"
        stroke="#20A0FF" />,
    'OpenMenu',
);

const CloseMenuIcon = createSvgIcon(
    <g fill="none" stroke="#20A0FF">
        <path d="M2 9.98V9C2 4 4 2 9 2H15C20 2 22 4 22 9V15C22 20 20 22 15 22H14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 11L18.01 5.98H14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.01 5.98V9.99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 16.15V18.85C11 21.1 10.1 22 7.85 22H5.15C2.9 22 2 21.1 2 18.85V16.15C2 13.9 2.9 13 5.15 13H7.85C10.1 13 11 13.9 11 16.15Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>,
    'CloseMenu',
);

/** Иконка кнопки свернуть/развернуть меню */
const Menu = ({ open = false, ...props }) => (open ? <CloseMenuIcon {...props} /> : <OpenMenuIcon {...props} />);

export default Menu;
