import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../icons/Logo';
import { useAuth } from '../lib/auth';

/** Экран входа (перенос Page/Login.js основной системы). */

const Root = styled('div')(({ theme }) => ({
    '& .paper': {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    '& .logo': {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        '& .img': {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 68,
            height: 68,
            padding: 15,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 5px #d5d5d5',
        },
        '& .text': {
            fontSize: 26,
            textTransform: 'uppercase',
            fontWeight: 'bold',
            marginTop: theme.spacing(2),
        },
    },
    '& .form': {
        width: '100%',
        marginTop: theme.spacing(2.5),
    },
    '& .input': {
        margin: '19px 0 9px !important',
    },
}));

export default function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ login: '', password: '' });
    const [errors, setErrors] = useState({ login: '', password: '' });
    const [loading, setLoading] = useState(false);

    if (user) {
        return <Navigate to={location.state?.from || '/houses'} replace />;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setErrors({ login: '', password: '' });
        try {
            await login(form.login.trim(), form.password);
            navigate(location.state?.from || '/houses', { replace: true });
        } catch (err) {
            if (err.errors) {
                const next = { login: '', password: '' };
                Object.entries(err.errors).forEach(([k, v]) => { next[k] = v[0]; });
                setErrors(next);
            } else {
                setErrors({ login: err.message || 'Ошибка входа', password: '' });
            }
        } finally {
            setLoading(false);
        }
    }

    const setFormValue = (name, value) => {
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    return (
        <Root>
            <Container component="main" maxWidth="xs">
                <div className="paper">
                    <Box className="logo">
                        <Box className="img"><Logo width={68} height={68} /></Box>
                        <span className="text">{document.title}</span>
                    </Box>
                    <form onSubmit={onSubmit} className="form" noValidate>
                        <TextField
                            size="medium"
                            className="input"
                            variant="outlined"
                            required
                            fullWidth
                            label="Логин"
                            name="login"
                            id="login"
                            autoFocus
                            autoComplete="username"
                            value={form.login}
                            onChange={(e) => setFormValue('login', e.target.value)}
                            error={errors.login.length > 0}
                            helperText={errors.login.length > 0 ? errors.login : false}
                        />
                        <TextField
                            size="medium"
                            className="input"
                            variant="outlined"
                            required
                            fullWidth
                            type="password"
                            label="Пароль"
                            name="password"
                            id="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(e) => setFormValue('password', e.target.value)}
                            error={errors.password.length > 0}
                            helperText={errors.password.length > 0 ? errors.password : false}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ display: 'flex', margin: '20px auto 0' }}
                            disabled={loading}
                        >
                            Войти
                        </Button>
                    </form>
                </div>
            </Container>
        </Root>
    );
}
