import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { fmtDateTime } from '../lib/format';
import CardWrapper from '../ui/CardWrapper';
import HeadingBlock from '../ui/HeadingBlock';
import Table from '../ui/Table';

/** Список пользователей (верстка по Page/User/UsersList.js основной системы). */
export default function UsersPage() {
    const { user: me } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load() {
        setLoading(true);
        setError('');
        try {
            const data = await api.users();
            setUsers(Array.isArray(data) ? data : data.data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function remove(u) {
        if (!window.confirm(`Удалить пользователя «${u.login}»?`)) return;
        try {
            await api.deleteUser(u.id);
            await load();
        } catch (e) {
            setError(e.message);
        }
    }

    const scopeText = (u) => {
        if (u.role === 'superadmin') return 'Все регионы';
        const regions = (u.regions || []).map((r) => r.name || r.id);
        return regions.length ? regions.join(', ') : '—';
    };
    const uksText = (u) => {
        if (u.role === 'superadmin') return 'Все';
        const uks = (u.uks || []).map((x) => x.name || `#${x.id}`);
        return uks.length ? uks.join(', ') : 'Все УК выбранных регионов';
    };

    const columns = [
        { headerName: 'ID', field: 'id', width: 60, align: 'right' },
        { headerName: 'Логин', field: 'login', width: 160, renderCell: ({ row }) => `${row.login}${row.id === me?.id ? ' (вы)' : ''}` },
        { headerName: 'Имя', field: 'name' },
        {
            headerName: 'Роль',
            field: 'role',
            width: 130,
            renderCell: ({ row }) => (row.role === 'superadmin'
                ? <Chip size="small" color="primary" label="superadmin" />
                : <Chip size="small" label="пользователь" />),
        },
        { headerName: 'Регионы', field: 'regions', renderCell: ({ row }) => scopeText(row) },
        { headerName: 'УК', field: 'uks', renderCell: ({ row }) => uksText(row) },
        {
            headerName: 'Статус',
            field: 'is_active',
            width: 100,
            align: 'center',
            renderCell: ({ row }) => (row.is_active
                ? <Chip size="small" color="success" label="активен" />
                : <Chip size="small" label="отключён" />),
        },
        { headerName: 'Добавлен', field: 'created_at', width: 140, renderCell: ({ row }) => fmtDateTime(row.created_at) },
        {
            headerName: '',
            field: 'actions',
            width: 90,
            align: 'right',
            renderCell: ({ row }) => (
                <Box sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" color="primary" title="Изменить" onClick={(e) => { e.stopPropagation(); navigate(`/users/${row.id}`); }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    {row.id !== me?.id ? (
                        <IconButton size="small" color="error" title="Удалить" onClick={(e) => { e.stopPropagation(); remove(row); }}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                </Box>
            ),
        },
    ];

    return (
        <CardWrapper spacing={2}>
            <div className="ListFirstLine">
                <HeadingBlock heading="Пользователи" subHeading="Учётные записи сервиса и их область видимости" />
                <Box className="RectButtonsContainer">
                    <Button variant="contained" color="primary" className="SquareButton" onClick={() => navigate('/users/new')}>
                        Добавить
                    </Button>
                </Box>
            </div>

            {error ? <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box> : null}

            <Table
                columns={columns}
                rows={users}
                loading={loading}
                loadingText="Загрузка данных"
                emptyListText="Пользователей нет"
                showTableFooter={false}
                handleRowClick={(e, row) => navigate(`/users/${row.id}`)}
            />
        </CardWrapper>
    );
}
