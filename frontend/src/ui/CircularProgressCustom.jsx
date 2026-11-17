import { keyframes, styled } from '@mui/material/styles';
import React from 'react';

/** Быстрый лоадер (перенесён из основной системы). */
const spin = keyframes({
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
});

const LoaderCircle = styled('div')(({ theme }) => ({
    animation: `${spin} 1.2s linear infinite`,
    border: `solid 2px ${theme.palette.primary.light}`,
    borderTop: 'solid 2px transparent',
    borderRadius: '100%',
    display: 'inline-block',
}));

const CircularProgressCustom = ({ size = 28 }) => (
    <LoaderCircle style={{ width: size, height: size }} data-testid="CircularProgressCustom" />
);

export default CircularProgressCustom;
