import Typography from '@mui/material/Typography';
import React from 'react';

const ContentHeading = ({ children }) => (
    <Typography variant="h1" component="h2" sx={{ marginBottom: '20px' }}>{children}</Typography>
);

export default ContentHeading;
