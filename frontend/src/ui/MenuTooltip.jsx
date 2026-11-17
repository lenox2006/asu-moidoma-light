import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';
import MenuIcon from '../icons/Menu';

/**
 * Боковое меню (перенос ui/Menu/MenuTooltip.tsx основной системы на react-router v6, без подменю).
 * rows: [{ name, link: string | string[], exact, iconSvg, onClick? }]
 */

const StyledList = styled(List)(({ theme }) => ({
    background: theme.palette.background.paper,
    position: 'relative',
    padding: 0,
    zIndex: 500,
}));

const opts = { shouldForwardProp: (prop) => !String(prop).startsWith('$') };

const StyledListItem = styled('div', opts)(({ theme, $collapsed, $fullwidth, $widthiconcollapsed }) => ({
    height: 54,
    width: $collapsed ? $widthiconcollapsed : $fullwidth,
    position: 'relative',
    marginBottom: '4px',
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    cursor: 'pointer',
    '& > a': {
        color: theme.palette.text.primary,
        textDecoration: 'none',
        '&.active > .MuiListItem-root': {
            backgroundColor: `${theme.palette.primary.main} !important`,
            color: theme.palette.common.white,
            '& .MuiListItemIcon-root svg': { fill: '#fff', color: '#fff' },
        },
    },
    '& .MuiListItemIcon-root svg': { width: '0.9em', height: '0.9em' },
}));

const StyledNavItem = styled(ListItem, opts)(({ theme, $collapsed, $fullwidth, $widthiconcollapsed }) => ({
    position: 'absolute',
    width: $fullwidth,
    left: 0,
    top: 0,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    backgroundColor: theme.palette.background.paper,
    paddingLeft: 0,
    paddingRight: 0,
    height: 54,
    ...($collapsed && {
        width: $widthiconcollapsed,
        '& .MuiListItemText-root': { left: $widthiconcollapsed + 30 },
    }),
}));

const StyledListItemIcon = styled(ListItemIcon, opts)(({ theme, $collapsed, $widthiconnotcollapsed, $widthiconcollapsed }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: $collapsed ? $widthiconcollapsed : $widthiconnotcollapsed,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
}));

const StyledIcon = styled(Box)(({ theme }) => ({
    width: '24px',
    height: '24px',
    '& svg': {
        transition: 'none',
        width: '100%!important',
        height: '100%!important',
        color: theme.palette.text.primary,
    },
}));

const StyledListItemText = styled(ListItemText, opts)(({ theme, $fullwidth, $widthiconcollapsed, $widthiconnotcollapsed }) => ({
    position: 'absolute',
    top: 0,
    left: $widthiconnotcollapsed / 2 + 26,
    height: 54,
    width: $fullwidth - $widthiconcollapsed,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    transition: theme.transitions.create('left', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shortest,
    }),
    '& > span': { lineHeight: '16px' },
}));

const CollapseButton = styled(IconButton)({
    position: 'absolute',
    width: 30,
    height: 30,
    top: -37,
    right: 0,
});

const MenuTooltip = ({
    menuCollapsed: collapsed = false,
    rows = [],
    widthIconCollapsed = 84,
    widthIconNotCollapsed = 84,
    fullWidth = 329,
    onMenuCollapseModeChange,
}) => {
    const location = useLocation();

    const isActive = (item) => {
        const links = Array.isArray(item.link) ? item.link : [item.link];
        return links.some((link) => matchPath({ path: link, end: item.exact ?? true }, location.pathname) !== null);
    };

    const sizes = { $collapsed: collapsed, $fullwidth: fullWidth, $widthiconcollapsed: widthIconCollapsed };
    const iconSizes = { $collapsed: collapsed, $widthiconnotcollapsed: widthIconNotCollapsed, $widthiconcollapsed: widthIconCollapsed };

    return (
        <StyledList component="div">
            {onMenuCollapseModeChange ? (
                <CollapseButton
                    size="medium"
                    title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
                    onClick={() => {
                        onMenuCollapseModeChange();
                        window.dispatchEvent(new Event('resize'));
                    }}
                >
                    <MenuIcon open={collapsed} style={{ width: 24, height: 24 }} />
                </CollapseButton>
            ) : null}

            {rows.map((item, index) => {
                const inner = (
                    <StyledNavItem {...sizes} component="div">
                        <StyledListItemIcon {...iconSizes}>
                            <StyledIcon>{item.iconSvg}</StyledIcon>
                        </StyledListItemIcon>
                        <StyledListItemText primary={item.name} {...sizes} $widthiconnotcollapsed={widthIconNotCollapsed} />
                    </StyledNavItem>
                );
                return (
                    <Tooltip key={`root-${index}`} title={item.name} disableHoverListener={!collapsed} placement="right" arrow>
                        <StyledListItem {...sizes}>
                            {item.onClick ? (
                                <a href="#" onClick={(e) => { e.preventDefault(); item.onClick(); }}>{inner}</a>
                            ) : (
                                <NavLink
                                    to={Array.isArray(item.link) ? item.link[0] : item.link}
                                    className={() => (isActive(item) ? 'active' : '')}
                                >
                                    {inner}
                                </NavLink>
                            )}
                        </StyledListItem>
                    </Tooltip>
                );
            })}
        </StyledList>
    );
};

export default MenuTooltip;
