import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

/** Подзаголовок внутри карточки с синей линией (перенесён из основной системы). */
const CardSubheading = ({ children, withBorder = true }) => (
    <Grid item xs={12} pb={2}>
        <Typography variant="subtitle1" sx={{ marginBottom: '16px', color: '#20a0ff' }}>
            {children}
        </Typography>
        {withBorder ? <Divider /> : null}
    </Grid>
);

export default CardSubheading;
