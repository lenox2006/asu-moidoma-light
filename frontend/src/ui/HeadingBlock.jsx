import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { Link } from 'react-router-dom';

const StyledLink = styled(Link)({
    color: '#939393',
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
        color: '#3490dc',
    },
});

/**
 * Заголовок страницы с хлебными крошками (перенесён из основной системы).
 * @param heading     текст H1 (или JSX)
 * @param subHeading  подзаголовок
 * @param breadcrumbs [{link: '/', name: 'Главная'}, ...] — последний элемент выводится текстом
 * @param loading
 */
const HeadingBlock = ({ heading, subHeading, breadcrumbs, loading = false }) => {
    const renderBreadcrumbs = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;
        const items = breadcrumbs.slice(0, -1);
        const last = breadcrumbs[breadcrumbs.length - 1];
        return (
            <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ marginLeft: 0 }}>
                {items.map((elem, idx) => (
                    elem.name && elem.link
                        ? <StyledLink to={elem.link} key={`bcrumb-${idx}`}>{elem.name}</StyledLink>
                        : null
                ))}
                {!loading
                    ? <Typography variant="body1" sx={{ fontSize: 'inherit', color: '#939393' }}>{last.name}</Typography>
                    : null}
            </Breadcrumbs>
        );
    };

    return (
        <Box sx={{ marginBottom: '24px' }}>
            {renderBreadcrumbs()}
            <Box display="flex" alignItems="center" flexWrap="wrap">
                {loading
                    ? <Skeleton variant="rectangular" width={260} height={25} sx={{ margin: '4px 0 7px' }} />
                    : (typeof heading === 'string'
                        ? <Typography variant="h1" sx={{ margin: '0 10px 0 0' }}>{heading}</Typography>
                        : heading)}
                {!loading && subHeading ? <Typography variant="h2">{subHeading}</Typography> : null}
            </Box>
        </Box>
    );
};

export default HeadingBlock;
