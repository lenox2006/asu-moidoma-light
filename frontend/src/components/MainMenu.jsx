import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import HouseIcon from '../icons/House';
import UsersAsuIcon from '../icons/UsersAsu';
import { useAuth } from '../lib/auth';
import MenuTooltip from '../ui/MenuTooltip';

const StyledBox = styled(Box)(({ theme }) => ({
    background: theme.palette.background.paper,
    marginTop: theme.spacing(8),
    marginRight: theme.spacing(4),
    maxWidth: 329,
    boxShadow: theme.shadows.paper,
    alignSelf: 'flex-start',
}));

const LOCAL_STORAGE_KEY = 'menu-main-is-collapsed';

/** Главное меню (перенос components/MainMenu.js основной системы). */
const MainMenu = () => {
    const { isSuperadmin } = useAuth();
    // По умолчанию меню свёрнуто (как на карточке дома); состояние запоминается в localStorage
    const [menuCollapsed, setMenuCollapsed] = useState(() => localStorage.getItem(LOCAL_STORAGE_KEY) !== 'false');

    const rows = [
        { name: 'Мои Дома', link: ['/houses', '/house'], exact: true, iconSvg: <HouseIcon /> },
    ];
    if (isSuperadmin) {
        rows.push({ name: 'Пользователи', link: ['/users', '/users/:id'], exact: true, iconSvg: <UsersAsuIcon /> });
    }

    return (
        <StyledBox>
            <MenuTooltip
                rows={rows}
                rowHeight={54}
                widthIconCollapsed={84}
                widthIconNotCollapsed={84}
                menuCollapsed={menuCollapsed}
                onMenuCollapseModeChange={() => {
                    setMenuCollapsed((prev) => {
                        localStorage.setItem(LOCAL_STORAGE_KEY, String(!prev));
                        return !prev;
                    });
                }}
            />
        </StyledBox>
    );
};

export default MainMenu;
