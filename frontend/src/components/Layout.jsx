import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { clearCrumbs } from '../lib/crumbs';
import Header from './Header';
import MainMenu from './MainMenu';

/** Каркас страницы (перенос Body.js + Main.js основной системы). */
export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Как в основной системе: на карточке МКД главное меню скрыто (там своё меню карточки)
    const mainMenuHidden = /^\/house(\/|$)/.test(location.pathname);

    async function onLogout() {
        await logout();
        clearCrumbs();
        navigate('/login', { replace: true });
    }

    return (
        <div>
            <Header userName={user?.name || ''} onLogout={onLogout} />
            <Container maxWidth="lg" sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                {!mainMenuHidden ? <MainMenu /> : null}
                <Box component="main" sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    <Box sx={{ width: '100%', marginTop: 4, marginBottom: 4 }}>
                        <Outlet />
                    </Box>
                </Box>
            </Container>
        </div>
    );
}
