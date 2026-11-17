import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

/**
 * Подпись над полем формы (упрощённый перенос из основной системы).
 * @param title     текст или JSX подписи
 * @param direction 'column' (подпись сверху) | 'row' (подпись слева 40%)
 * @param required  звёздочка
 */
const FormInputContainer = ({ title, direction = 'column', required = false, children, style }) => {
    if (!children) return null;
    const row = direction === 'row';

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                flexDirection: row ? 'row' : 'column',
                justifyContent: 'flex-start',
                alignItems: row ? 'center' : 'stretch',
                height: '100%',
                ...(style || {}),
            }}
        >
            {title ? (
                <Box
                    sx={{
                        width: row ? '40%' : '100%',
                        marginBottom: row ? 0 : 1,
                        flexGrow: row ? 0 : 1, // в колонке подпись «прижимается» к полю — поля соседних колонок на одной линии
                        paddingRight: row ? 5 : 0,
                        textAlign: row ? 'right' : 'left',
                        color: (theme) => theme.palette.common.darkGrey,
                        display: 'flex',
                        justifyContent: row ? 'flex-end' : 'space-between',
                        alignItems: 'flex-end',
                    }}
                >
                    <Typography variant="body2" component="div" sx={{ lineHeight: '16px' }}>
                        {title}
                        {required ? <Box component="span" sx={{ color: 'error.main', fontSize: 20, lineHeight: '10px', ml: '2px' }}>*</Box> : null}
                    </Typography>
                </Box>
            ) : null}
            <Box sx={{ width: row ? '60%' : '100%' }}>{children}</Box>
        </Box>
    );
};

export default FormInputContainer;
