import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import React from 'react';
import CircularProgressCustom from './CircularProgressCustom';

const StyledPaper = styled(Paper)({
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 0 10px 0px rgb(0 0 0 / 9%)',
});

const StyledLoader = styled('div')({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
});

/**
 * Карточка с одинаковым отступом (перенесена из основной системы).
 * @param spacing MUI-отступ (×8), по умолчанию 3
 * @param loading заливка карточки с лоадером по центру
 */
const CardWrapper = ({ spacing = 3, style = null, loading = false, children }) => (
    <StyledPaper variant="outlined" sx={{ padding: spacing, ...(style || {}) }}>
        {loading ? <StyledLoader><CircularProgressCustom /></StyledLoader> : null}
        {children}
    </StyledPaper>
);

export default CardWrapper;
