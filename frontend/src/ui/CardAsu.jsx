import Grid from '@mui/material/Grid';
import React from 'react';
import CardSubheading from './CardSubheading';
import CardWrapper from './CardWrapper';

/** Карточка с заголовком (перенесена из основной системы). */
const CardAsu = ({ heading = null, loading = false, cardStyle = null, children }) => (
    <CardWrapper loading={loading} style={cardStyle}>
        <Grid container spacing={3}>
            {heading ? <CardSubheading>{heading}</CardSubheading> : null}
            {children}
        </Grid>
    </CardWrapper>
);

export default CardAsu;
