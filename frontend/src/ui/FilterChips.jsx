import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledIconButton = styled(IconButton)({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    borderLeft: 'solid 1px #f1f1f1',
    width: '10px',
    margin: 0,
    padding: '0 10px',
});

const StyledChip = styled(Chip)({
    margin: '0 6px 6px 0',
    '& .MuiChip-label': {
        paddingLeft: '20px',
        paddingRight: '20px',
    },
});

/**
 * Чипы выбранных уровней (перенос HouseListFiltersChipsFias).
 * chips: [{ key, label, locked, onClick, onDelete }]
 */
const FilterChips = ({ chips = [] }) => (
    <Box display="flex" flexWrap="wrap">
        {chips.map((c) => (
            <StyledChip
                size="small"
                key={c.key}
                label={c.label}
                color="primary"
                onClick={c.onClick}
                onDelete={c.locked ? undefined : c.onDelete}
                title={c.locked ? 'Область видимости пользователя' : undefined}
                deleteIcon={(
                    <StyledIconButton aria-label="delete" component="span">
                        <CloseIcon fontSize="small" />
                    </StyledIconButton>
                )}
            />
        ))}
    </Box>
);

export default FilterChips;
