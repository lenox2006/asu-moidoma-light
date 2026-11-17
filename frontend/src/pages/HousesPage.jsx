import InfoIcon from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { getCrumbs, rememberCrumbs } from '../lib/crumbs';
import { exportCsv } from '../lib/csv';
import { fmtArea, fmtDateTime, fmtInt, LEVEL_TITLES } from '../lib/format';
import CardWrapper from '../ui/CardWrapper';
import FilterChips from '../ui/FilterChips';
import HeadingBlock from '../ui/HeadingBlock';
import Table from '../ui/Table';

/**
 * Главный экран «Мои дома» (верстка по Page/HouseList/HouseListFias.js основной системы):
 * регионы → УК → улицы → дома. Уровень определяется параметром `mark` в URL.
 */

const UK_TABS = [
    ['our', 'Обслуживаемые'],
    ['gone', 'Ушедшие'],
    ['foreign', 'Сторонние'],
    ['all', 'Все УК'],
];

/** Статус УК закодирован в префиксе наименования: "[Сторонняя] ...", "[Ушедшая] ...". */
function ukStatus(row) {
    const m = typeof row.company === 'string' ? row.company.match(/^\[([^\]]*)\]/) : null;
    if (!m) return 'our';
    const tag = m[1].toLowerCase();
    if (tag.startsWith('ушед')) return 'gone';
    if (tag.startsWith('сторон')) return 'foreign';
    return 'other';
}

function SearchIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#20a0ff" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
        </svg>
    );
}

export default function HousesPage() {
    const { start } = useAuth();
    const [params, setParams] = useSearchParams();

    const mark = params.has('mark') ? params.get('mark') || '' : start.mark || '';

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [byPage, setByPage] = useState(true);
    const [sumResults, setSumResults] = useState(true);
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [ukTab, setUkTab] = useState('our');

    // Цепочка уровней для текущего mark. Защита от старых записей: крошка дома под mark списка отбрасывается.
    const crumbs = useMemo(() => {
        const c = [...getCrumbs(mark, start.crumbs || [])];
        while (c.length && (c[c.length - 1].level === 'house' || c[c.length - 1].level === 'card') && c[c.length - 1].mark === mark) c.pop();
        return c;
    }, [mark, start.crumbs]);
    const startLen = (start.crumbs || []).length;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        setSearch('');
        setPage(1);
        api.houses(mark)
            .then((d) => !cancelled && setData(d))
            .catch((e) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [mark]);

    const level = data?.level || null;
    const items = data?.items || [];
    const showUkTabs = level === 'uk';

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = items;
        if (showUkTabs && ukTab !== 'all') rows = rows.filter((r) => ukStatus(r) === ukTab);
        if (!q) return rows;
        return rows.filter((r) => [r.address, r.company, r.next_text, r.build_years]
            .filter((v) => v !== null && v !== undefined)
            .some((v) => String(v).toLowerCase().includes(q)));
    }, [items, search, showUkTabs, ukTab]);

    const ukCounts = useMemo(() => {
        const c = { our: 0, gone: 0, foreign: 0, other: 0, all: items.length };
        if (showUkTabs) items.forEach((r) => { c[ukStatus(r)] += 1; });
        return c;
    }, [items, showUkTabs]);

    const summaryRow = useMemo(() => {
        if (!sumResults || filtered.length === 0) return null;
        const t = { address: 'Итого', company: level === 'region' ? 0 : '', house_cnt: 0, entrances: 0, elevators: 0, full_area: 0 };
        const range = (vals) => {
            const nums = vals.flatMap((s) => String(s || '').split('-').map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x)));
            if (!nums.length) return '';
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            return min === max ? String(min) : `${min}-${max}`;
        };
        filtered.forEach((r) => {
            if (typeof r.company === 'number') t.company += r.company;
            t.house_cnt += Number(r.house_cnt) || 0;
            t.entrances += Number(r.entrances) || 0;
            t.elevators += Number(r.elevators) || 0;
            t.full_area += Number(r.full_area) || 0;
        });
        t.build_years = range(filtered.map((r) => r.build_years));
        t.floors = range(filtered.map((r) => r.floors));
        return t;
    }, [filtered, sumResults, level]);

    const totalPages = byPage ? Math.max(1, Math.ceil(filtered.length / perPage)) : 1;
    const safePage = Math.min(page, totalPages);
    const visible = byPage ? filtered.slice((safePage - 1) * perPage, safePage * perPage) : filtered;

    const columns = useMemo(() => [
        {
            headerName: 'Адрес',
            field: 'address',
            align: 'left',
            renderCell: ({ row }) => (
                <Box display="flex" alignItems="center">
                    <span>{row.address || row.next_text || ''}</span>
                    {row.is_our_management === true ? (
                        <Tooltip title="На обслуживании" arrow>
                            <InfoIcon fontSize="small" sx={{ ml: 1, color: '#939393' }} />
                        </Tooltip>
                    ) : null}
                </Box>
            ),
        },
        {
            headerName: 'УК',
            field: 'company',
            align: level === 'region' ? 'right' : 'left',
            renderCell: ({ row }) => (typeof row.company === 'number' ? fmtInt(row.company) : (row.company ?? '')),
        },
        { headerName: 'МКД', field: 'house_cnt', align: 'right', width: 67, renderCell: ({ row }) => fmtInt(row.house_cnt) },
        { headerName: 'Год постройки', field: 'build_years', align: 'right', width: 130 },
        { headerName: 'Этажность', field: 'floors', align: 'right', width: 100 },
        { headerName: 'Подъездов', field: 'entrances', align: 'right', width: 100, renderCell: ({ row }) => fmtInt(row.entrances) },
        { headerName: 'Лифтов', field: 'elevators', align: 'right', width: 80, renderCell: ({ row }) => fmtInt(row.elevators) },
        { headerName: 'Площадь', field: 'full_area', align: 'right', width: 100, renderCell: ({ row }) => fmtArea(row.full_area) },
    ], [level]);

    function goTo(nextMark, nextCrumbs) {
        rememberCrumbs(nextMark, nextCrumbs);
        setParams({ mark: nextMark });
    }

    /** Строка — дом, если следующего уровня нет, есть идентификатор дома или текущий список — уровень домов. */
    function isHouseRow(row) {
        return row.next_level === 'house'
            || row.next_level === 'card'   // кондуктор: следующий уровень после дома — карточка
            || !row.next_level
            || row.build_id !== undefined
            || row.buildId !== undefined
            || level === 'house'
            || level === 'card';
    }

    function rowClick(event, row) {
        event.preventDefault();

        if (isHouseRow(row)) {
            // buildId дома — идентификатор из getHouseList на уровне домов
            const buildId = row.build_id ?? row.buildId ?? row.next_value ?? row.id ?? row.house_id;
            if (buildId === undefined || buildId === null || buildId === '') {
                setError('В строке дома нет идентификатора (build_id / buildId / next_value) — карточку открыть нельзя');
                return;
            }
            // Крошку дома под mark списка НЕ записываем (иначе она затирает цепочку улицы).
            // Карточке передаём mark дома (права), mark списка (возврат, крошки) и адрес (новая вкладка).
            const rowMark = row.mark || mark;
            const url = `/app/house?build_id=${encodeURIComponent(buildId)}&mark=${encodeURIComponent(rowMark)}`
                + `&list=${encodeURIComponent(mark)}&address=${encodeURIComponent(row.address || row.next_text || '')}`;
            window.open(url, '_blank', 'noopener');
            return;
        }

        if (!row.mark || row.mark === mark) return;
        goTo(row.mark, [...crumbs, { level: row.next_level, text: row.next_text || row.address, mark: row.mark }]);
    }

    function removeCrumb(i) {
        if (i < startLen) return;
        const kept = crumbs.slice(0, i);
        goTo(i === 0 ? start.mark || '' : kept[i - 1].mark, kept);
    }

    const chips = crumbs.map((c, i) => ({
        key: c.mark || i,
        label: c.text,
        locked: i < startLen,
        onClick: i === crumbs.length - 1 ? undefined : () => goTo(c.mark, crumbs.slice(0, i + 1)),
        onDelete: () => removeCrumb(i),
    }));

    const filterUsed = crumbs.length > startLen;

    return (
        <CardWrapper spacing={2}>
            <div className="ListFirstLine">
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <HeadingBlock
                        heading="Мои дома"
                        subHeading={level ? LEVEL_TITLES[level] || level : ''}
                    />
                </div>
                <Box className="RectButtonsContainer">
                    <Button
                        variant="outlined"
                        color="primary"
                        className="SquareButton"
                        disabled={!filtered.length}
                        onClick={() => exportCsv(filtered, `asu-light-${level || 'list'}.csv`)}
                    >
                        Выгрузить
                    </Button>
                </Box>
            </div>

            <div className="ListSecondLine">
                <div style={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Поиск"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ marginBottom: '12px', width: '308px' }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" edge="end" tabIndex={-1}><SearchIcon /></IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FilterChips chips={chips} />

                    <Box style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <Box>
                            <div>Найдено: {loading ? '…' : filtered.length}</div>
                            {data?.fetched_at ? (
                                <Typography variant="body2" sx={{ color: '#939393' }}>
                                    Данные получены {fmtDateTime(data.fetched_at)}
                                </Typography>
                            ) : null}
                        </Box>

                        <Box style={{ display: 'flex', flexDirection: 'row' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', marginRight: '20px', alignItems: 'center' }}>
                                <span style={{ margin: '0 10px' }}>Постранично</span>
                                <Switch disabled={loading} checked={byPage} onChange={() => setByPage((v) => !v)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <span style={{ margin: '0 10px' }}>Сводные итоги</span>
                                <Switch disabled={loading} checked={sumResults} onChange={() => setSumResults((v) => !v)} />
                            </div>
                        </Box>

                        <Box>
                            <Button
                                variant="text"
                                color="primary"
                                size="small"
                                disabled={loading || !filterUsed}
                                onClick={() => goTo(start.mark || '', start.crumbs || [])}
                            >
                                Сбросить
                            </Button>
                        </Box>
                    </Box>
                </div>
            </div>

            <Box mt={2}>
                <Tabs
                    value={showUkTabs ? ukTab : 'my'}
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={(e, v) => { setUkTab(v); setPage(1); }}
                >
                    {showUkTabs
                        ? UK_TABS.map(([key, title]) => <Tab key={key} value={key} label={`${title} (${ukCounts[key]})`} />)
                        : <Tab value="my" label="Мои дома" />}
                </Tabs>

                {error ? (
                    <Box sx={{ color: 'error.main', border: '1px solid #61bbff', borderRadius: '0 4px 4px 4px', p: 2 }}>{error}</Box>
                ) : (
                    <Table
                        columns={columns}
                        rows={visible}
                        summaryRow={summaryRow}
                        rowsPerPageOptions={[5, 25, 50, 100, 200]}
                        tableMaxHeight={null}
                        tableMinHeight={508}
                        paginationCurrentPage={safePage}
                        paginationRowsPerPage={byPage ? perPage : Math.max(filtered.length, 1)}
                        paginationRowsCount={filtered.length}
                        loading={loading}
                        loadingText="Загрузка данных"
                        emptyListText="Нет записей"
                        handleRowClick={rowClick}
                        onRowsPerPageChange={(value) => { setPerPage(parseInt(value, 10)); setPage(1); }}
                        onPageChange={(value) => setPage(parseInt(value, 10))}
                    />
                )}
            </Box>
        </CardWrapper>
    );
}
