import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './lib/auth';
import HouseCardPage from './pages/HouseCardPage';
import HousesPage from './pages/HousesPage';
import LoginPage from './pages/LoginPage';
import UserEditPage from './pages/UserEditPage';
import UsersPage from './pages/UsersPage';
import { lightTheme } from './theme/theme';

function RequireAuth() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (
            <Backdrop open invisible>
                <CircularProgress color="primary" disableShrink />
            </Backdrop>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return <Outlet />;
}

function RequireSuperadmin() {
    const { isSuperadmin } = useAuth();
    return isSuperadmin ? <Outlet /> : <Navigate to="/houses" replace />;
}

export default function App() {
    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <BrowserRouter basename="/app">
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<RequireAuth />}>
                            <Route element={<Layout />}>
                                <Route path="/houses" element={<HousesPage />} />
                                <Route path="/house" element={<HouseCardPage />} />
                                <Route element={<RequireSuperadmin />}>
                                    <Route path="/users" element={<UsersPage />} />
                                    <Route path="/users/:id" element={<UserEditPage />} />
                                </Route>
                            </Route>
                        </Route>
                        <Route path="*" element={<Navigate to="/houses" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}
