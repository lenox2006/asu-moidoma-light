import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import GeneralInformationIcon from '../icons/GeneralInformation';
import HouseIcon from '../icons/House';
import { useAuth } from '../lib/auth';
import { getCrumbs } from '../lib/crumbs';
import { BILLING, dict, MANAGEMENT_TYPE, UK_BRANCH } from '../lib/dictionaries';
import { fmtAreaExact, fmtIntZero, fmtText } from '../lib/format';
import CardAsu from '../ui/CardAsu';
import CardSubheading from '../ui/CardSubheading';
import CardWrapper from '../ui/CardWrapper';
import ContentHeading from '../ui/ContentHeading';
import FormInputContainer from '../ui/FormInputContainer';
import MenuTooltip from '../ui/MenuTooltip';

/**
 * Карточка МКД, вкладка «Общие сведения»
 * (верстка по Page/houseInfo/HouseCard.js + General.js + MkdMenu.js основной системы).
 *
 * Данные — метод кондуктора getHouseById (buildId из списка домов). Поля ответа:
 *   FLATS                  — количество жилых помещений
 *   LIVINGAREA             — жилая площадь
 *   NonFlats               — количество нежилых помещений
 *   NONLIVINGAREA          — площадь нежилых помещений
 *   buildEntryDate         — дата ввода в эксплуатацию
 *   MAINTENANCE_ENTRYDATE  — дата начала управления
 * Площадь жилых и нежилых помещений = LIVINGAREA + NONLIVINGAREA.
 *   ENTRANCE_COUNT         — количество подъездов
 *   ELEVATOR_COUNT         — количество лифтов
 *   minLevels              — количество этажей
 *   MOP                    — площадь МОП; общая площадь объекта = LIVINGAREA + NONLIVINGAREA + MOP
 *   UKNAME                 — наименование УК
 *   BASIS_MANAGEMENT       — основание для управления (пусто → «Не определено»)
 *   management_type_id     — вид обслуживания (справочник MANAGEMENT_TYPE)
 *   BILLING_ID             — расчётный центр (справочник BILLING)
 *   UK_BRANCH_ID           — филиал (справочник UK_BRANCH)
 *   PROJECT_TYPE / PROJECT_SERIES — тип / серия проекта
 * Остальные поля ищутся по нескольким вариантам имени без учёта регистра.
 */

const MenuBox = styled(Box)(({ theme }) => ({
    background: theme.palette.background.paper,
    marginTop: theme.spacing(8),
    marginRight: theme.spacing(4),
    boxShadow: theme.shadows.paper,
    alignSelf: 'flex-start',
}));

function Field({ label, value }) {
    const empty = value === null || value === undefined || value === '' || value === '—';
    return (
        <FormInputContainer title={label}>
            <TextField disabled value={empty ? '' : String(value)} variant="outlined" fullWidth placeholder="—" />
        </FormInputContainer>
    );
}

/** Разворачивает вложенные объекты ответа в плоский вид: {a: {b: 1}} → {"a.b": 1}. */
function flatten(obj, prefix = '', out = {}) {
    Object.entries(obj || {}).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
        else out[key] = v;
    });
    return out;
}

/** Поиск значения по имени поля без учёта регистра (точное имя или последний сегмент вложенного ключа). */
function findKey(obj, key) {
    const want = key.toLowerCase();
    const keys = Object.keys(obj);
    return keys.find((k) => k.toLowerCase() === want)
        || keys.find((k) => k.toLowerCase().endsWith(`.${want}`))
        || null;
}

/**
 * Первое непустое значение из списка возможных имён поля.
 * sources — массив источников по приоритету: сначала ответ getHouseById, затем строка списка.
 */
function pick(sources, ...keys) {
    for (const obj of sources) {
        if (!obj) continue;
        for (const k of keys) {
            const real = findKey(obj, k);
            if (real !== null) {
                const v = obj[real];
                if (v !== undefined && v !== null && v !== '') return v;
            }
        }
    }
    return null;
}

const num = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isNaN(n) ? null : n;
};

/** Дата из кондуктора (ISO / "YYYY-MM-DD" / "DD.MM.YYYY") → "DD.MM.YYYY". */
function fmtDate(v) {
    if (v === null || v === undefined || v === '') return '—';
    const s = String(v).trim();
    if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('ru-RU');
}

/** Год из даты или числа. */
function fmtYear(v) {
    if (v === null || v === undefined || v === '') return '—';
    const s = String(v).trim();
    if (/^\d{4}$/.test(s)) return s;
    let m = s.match(/^(\d{4})-\d{2}-\d{2}/);
    if (m) return m[1];
    m = s.match(/^\d{2}\.\d{2}\.(\d{4})/);
    if (m) return m[1];
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : String(d.getFullYear());
}

/** "г. Волжский, пл. Труда, д. 5" → { short: "пл. Труда, д. 5", city: "г. Волжский" } */
function splitAddress(address) {
    if (!address) return { short: '', city: '' };
    const parts = String(address).split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 1) return { short: address, city: '' };
    return { short: parts.slice(-2).join(', '), city: parts.slice(0, -2).join(', ') };
}

export default function HouseCardPage() {
    const { start } = useAuth();
    const [params] = useSearchParams();
    const location = useLocation();
    const mark = params.get('mark') || '';
    const buildId = params.get('build_id') || '';
    // Строка списка приходит через state (та же вкладка) либо адрес — через URL (новая вкладка)
    const rowFromList = location.state?.row || (params.get('address') ? { address: params.get('address') } : null);

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    // Меню карточки при открытии всегда свёрнуто (можно развернуть на время просмотра)
    const [menuCollapsed, setMenuCollapsed] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        if (!buildId) {
            setError('Не указан идентификатор дома (build_id)');
            setLoading(false);
            return undefined;
        }
        api.houseCard(buildId, mark)
            .then((d) => !cancelled && setData(d))
            .catch((e) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [buildId, mark]);

    // Источники данных по приоритету: ответ getHouseById, затем строка списка
    // (адрес, УК, этажность из списка показываются сразу, пока грузится карточка).
    const house = useMemo(() => [flatten((data && data.house) || {}), rowFromList || {}], [rowFromList, data]);

    // mark списка домов, откуда открыта карточка: явно из URL (list=…), иначе — по сохранённой цепочке.
    const listMark = params.has('list') ? params.get('list') || '' : (() => {
        const c = getCrumbs(mark, start.crumbs || []);
        const last = c[c.length - 1];
        return last && (last.level === 'house' || last.level === 'card') && c.length > 1 ? c[c.length - 2].mark : mark;
    })();
    const parentCrumbs = useMemo(() => {
        const c = [...getCrumbs(listMark, start.crumbs || [])];
        while (c.length && (c[c.length - 1].level === 'house' || c[c.length - 1].level === 'card') && c[c.length - 1].mark === listMark) c.pop();
        return c;
    }, [listMark, start.crumbs]);
    const listLink = `/houses?mark=${encodeURIComponent(listMark)}`;

    const address = pick(house, 'address', 'full_address', 'ADDRESS');
    const { short, city } = splitAddress(address);
    const heading = short || rowFromList?.next_text || 'Дом';

    const companyValue = pick(house, 'UKNAME', 'company', 'company_name', 'uk_name');
    const company = typeof companyValue === 'string' ? companyValue.replace(/^\[[^\]]*\]\s*/, '') : companyValue;

    // --- Поля по ТЗ ---
    const flats = pick(house, 'FLATS');
    const livingArea = num(pick(house, 'LIVINGAREA'));
    const nonFlats = pick(house, 'NonFlats');
    const nonLivingArea = num(pick(house, 'NONLIVINGAREA'));
    const premisesArea = livingArea === null && nonLivingArea === null ? null : (livingArea || 0) + (nonLivingArea || 0);
    const buildEntryDate = pick(house, 'buildEntryDate');
    const maintenanceEntryDate = pick(house, 'MAINTENANCE_ENTRYDATE');
    const mopArea = num(pick(house, 'MOP', 'mop_area', 'MOPAREA'));
    // Общая площадь объекта = LIVINGAREA + NONLIVINGAREA + MOP
    const totalArea = livingArea === null && nonLivingArea === null && mopArea === null
        ? null
        : (livingArea || 0) + (nonLivingArea || 0) + (mopArea || 0);
    const basisManagement = pick(house, 'BASIS_MANAGEMENT', 'MAINTENANCE_BASIS', 'management_basis');

    const ready = !loading || rowFromList;

    const menuRows = [
        { name: 'Общие сведения', link: '/house', exact: false, iconSvg: <GeneralInformationIcon /> },
        { name: 'К списку домов', link: listLink, exact: true, iconSvg: <HouseIcon /> },
    ];

    return (
        <Box style={{ display: 'flex', height: '100%' }}>
            <MenuBox>
                <MenuTooltip
                    rows={menuRows}
                    widthIconCollapsed={84}
                    widthIconNotCollapsed={84}
                    menuCollapsed={menuCollapsed}
                    onMenuCollapseModeChange={() => setMenuCollapsed((v) => !v)}
                />
            </MenuBox>

            <Box sx={{ width: '100%' }}>
                <Box style={{ display: 'flex', width: '100%', alignItems: 'flex-end', position: 'relative' }}>
                    <Box sx={{ marginBottom: '24px', flexGrow: 1 }}>
                        <Box sx={{ fontSize: 14, color: '#939393', mb: '9px', '& a': { color: '#939393', textDecoration: 'none' }, '& a:hover': { textDecoration: 'underline', color: '#3490dc' } }}>
                            <Link to="/houses">Главная</Link>
                            {parentCrumbs.map((c) => (
                                <span key={c.mark}>
                                    {' › '}
                                    <Link to={`/houses?mark=${encodeURIComponent(c.mark)}`}>{c.text}</Link>
                                </span>
                            ))}
                            {' › '}{heading}
                        </Box>
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                            <Typography variant="h1" sx={{ margin: '0 10px 0 0' }}>{heading}</Typography>
                            {city ? <Typography variant="h2">({city})</Typography> : null}
                        </Box>
                    </Box>
                </Box>

                {error ? <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box> : null}

                <Box pb={3} sx={{ width: '100%' }}>
                    <ContentHeading>Общие сведения</ContentHeading>
                    <Grid container spacing={0}>
                        <Grid item xs={12} pb={2}>
                            <CardWrapper loading={!ready}>
                                <Grid container>
                                    <Grid item xs={12} pb={2}>
                                        <Grid container spacing={1}>
                                            <Grid item md={6} xs={12}>
                                                <Grid container spacing={2}>
                                                    <CardSubheading>Жилые помещения</CardSubheading>
                                                    <Grid item md={6} xs={12}>
                                                        <Field label={<>Количество<sup>&nbsp;</sup></>} value={fmtIntZero(flats)} />
                                                    </Grid>
                                                    <Grid item md={6} xs={12}>
                                                        <Field label={<>Площадь, м<sup>2</sup></>} value={fmtAreaExact(livingArea)} />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item md={6} xs={12}>
                                                <Grid container spacing={2}>
                                                    <CardSubheading>Нежилые помещения</CardSubheading>
                                                    <Grid item md={6} xs={12}>
                                                        <Field label={<>Количество<sup>&nbsp;</sup></>} value={fmtIntZero(nonFlats)} />
                                                    </Grid>
                                                    <Grid item md={6} xs={12}>
                                                        <Field label={<>Площадь, м<sup>2</sup></>} value={fmtAreaExact(nonLivingArea)} />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} pb={2}>
                                        <Grid container spacing={2}>
                                            <Grid item md={4} xs={12}>
                                                <Field label={<>Общая площадь объекта, м<sup>2</sup></>} value={fmtAreaExact(totalArea)} />
                                            </Grid>
                                            <Grid item md={4} xs={12}>
                                                <Field label={<>Площадь жилых и нежилых помещений, м<sup>2</sup></>} value={fmtAreaExact(premisesArea)} />
                                            </Grid>
                                            <Grid item md={4} xs={12}>
                                                <Field label={<>Общая площадь МОП, м<sup>2</sup></>} value={fmtAreaExact(mopArea)} />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Grid container spacing={2}>
                                            <Grid item md={4} xs={12}>
                                                <Field label="Количество этажей" value={fmtText(pick(house, 'minLevels', 'floors', 'FLOORS'))} />
                                            </Grid>
                                            <Grid item md={4} xs={12}>
                                                <Field label="Количество подъездов" value={fmtIntZero(pick(house, 'ENTRANCE_COUNT', 'entrances', 'ENTRANCES'))} />
                                            </Grid>
                                            <Grid item md={4} xs={12}>
                                                <Field label="Количество лифтов" value={fmtIntZero(pick(house, 'ELEVATOR_COUNT', 'elevators', 'ELEVATORS'))} />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardWrapper>
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container>
                                <Grid item md={6} xs={12} pr={1}>
                                    <CardAsu heading="Управляющая компания">
                                        <Grid item xs={12}>
                                            <Field label="Наименование" value={company} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Field label="Дата начала управления" value={fmtDate(maintenanceEntryDate)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Field label="Основание для управления" value={basisManagement === null || basisManagement === '' ? 'Не определено' : fmtText(basisManagement)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Field label="Филиал" value={fmtText(dict(UK_BRANCH, pick(house, 'UK_BRANCH_ID', 'uk_branch_id')))} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Field label="Вид обслуживания" value={fmtText(dict(MANAGEMENT_TYPE, pick(house, 'management_type_id', 'MANAGEMENT_TYPE_ID')))} />
                                        </Grid>
                                    </CardAsu>
                                </Grid>
                                <Grid item md={6} xs={12} pl={1}>
                                    <Grid container>
                                        <Grid item xs={12} pb={2}>
                                            <CardAsu heading="Сведения об объекте">
                                                <Grid item xs={12}>
                                                    <Grid container spacing={1}>
                                                        <Grid item md={6} xs={12}>
                                                            <Field label="Год постройки" value={fmtText(pick(house, 'build_years', 'BUILDYEAR', 'build_year', 'BUILDDATE', 'year_built'))} />
                                                        </Grid>
                                                        <Grid item md={6} xs={12}>
                                                            <Field label="Год ввода в эксплуатацию" value={fmtYear(buildEntryDate)} />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Grid container spacing={1}>
                                                        <Grid item md={6} xs={12}>
                                                            <Field label="Серия проекта" value={fmtText(pick(house, 'PROJECT_SERIES', 'project_series'))} />
                                                        </Grid>
                                                        <Grid item md={6} xs={12}>
                                                            <Field label="Тип проекта" value={fmtText(pick(house, 'PROJECT_TYPE', 'project_type'))} />
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                                <Grid item md={6} xs={12}>
                                                    <Field label="Тип объекта" value={pick(house, 'OBJECTTYPE', 'object_type', 'HOUSETYPE', 'house_type') || 'МКД'} />
                                                </Grid>
                                            </CardAsu>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <CardAsu heading="Расчётный центр">
                                                <Grid item md={6} xs={12}>
                                                    <Field label="Биллинг" value={fmtText(dict(BILLING, pick(house, 'BILLING_ID', 'billing_id')))} />
                                                </Grid>
                                            </CardAsu>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item>
                            <Button component={Link} to={listLink} variant="outlined" color="primary">
                                К списку
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}
