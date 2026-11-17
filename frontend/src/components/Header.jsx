import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../icons/Logo';

/** Шапка (перенос components/Header.js основной системы). */
const Header = ({ userName = '', onLogout }) => (
    <Box sx={{ width: '100%', height: 80 }}>
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                height: 80,
                backgroundColor: 'background.paper',
                padding: '0 15px',
                zIndex: (theme) => theme.zIndex.appBar,
                boxShadow: (theme) => theme.shadows.paper,
            }}
        >
            <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '100%' }}>
                <Box sx={{ display: 'flex', flexGrow: 1 }}>
                    <Box
                        component={NavLink}
                        to="/houses"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            '& svg': { marginTop: '-1px' },
                            '& span': { marginLeft: '12px', color: 'primary.main' },
                        }}
                    >
                        <Logo width={28} height={29} />
                        <Typography variant="subtitle1" component="span">{document.title}</Typography>
                    </Box>
                </Box>

                <Box sx={{ margin: '1px 11px 0 0', color: 'primary.main' }}>
                    <Typography component="span" variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                        {userName}
                    </Typography>
                </Box>

                <IconButton
                    color="primary"
                    aria-label="logout"
                    title="Выйти"
                    size="medium"
                    onClick={onLogout}
                    sx={{
                        p: '12px',
                        opacity: 0.5,
                        transition: 'background-color, opacity 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                        '&:hover': { opacity: 1 },
                        '& svg path': {
                            stroke: (theme) => theme.palette.primary.main,
                            strokeWidth: '1.5',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeMiterlimit: '10',
                        },
                    }}
                >
                    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.4399 15.12L19.9999 12.56L17.4399 10" />
                        <path d="M9.76001 12.5601H19.93" />
                        <path d="M11.76 20.5C7.34001 20.5 3.76001 17.5 3.76001 12.5C3.76001 7.5 7.34001 4.5 11.76 4.5" />
                    </svg>
                </IconButton>
            </Container>
        </AppBar>
    </Box>
);

export default Header;
