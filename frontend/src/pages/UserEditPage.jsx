import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import CardAsu from '../ui/CardAsu';
import FormInputContainer from '../ui/FormInputContainer';
import HeadingBlock from '../ui/HeadingBlock';

/**
 * Создание / редактирование пользователя (верстка по Page/User/UsersEdit.js основной системы).
 * Пользователь привязывается к нескольким регионам и нескольким УК.
 */

const cleanName = (s) => (typeof s === 'string' ? s.replace(/^\[[^\]]*\]\s*/, '') : s);

const EMPTY = {
    login: '',
    name: '',
    password: '',
    role: 'user',
    regions: [],
    uks: [],
    is_active: true,
};

export default function UserEditPage() {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const { user: me } = useAuth();

    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');

    // Справочники из кондуктора
    const [regionOptions, setRegionOptions] = useState([]);   // [{id, name, mark}]
    const [regionsLoading, setRegionsLoading] = useState(true);
    const [ukCache, setUkCache] = useState({});               // regionId → [{id, name, region_id}]
    const [uksLoading, setUksLoading] = useState(false);

    // Загрузка пользователя
    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        setLoading(true);
        api.users()
            .then((list) => {
                if (cancelled) return;
                const arr = Array.isArray(list) ? list : list.data || [];
                const u = arr.find((x) => String(x.id) === String(id));
                if (!u) {
                    setError('Пользователь не найден');
                    return;
                }
                setForm({
                    login: u.login,
                    name: u.name,
                    password: '',
                    role: u.role,
                    regions: u.regions || [],
                    uks: u.uks || [],
                    is_active: Boolean(u.is_active),
                });
            })
            .catch((e) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [id, isNew]);

    // Список регионов — из кондуктора (mark пустой)
    useEffect(() => {
        let cancelled = false;
        setRegionsLoading(true);
        api.houses('')
            .then((d) => !cancelled && setRegionOptions((d.items || []).map((r) => ({
                id: String(r.next_value),
                name: r.next_text || r.address,
                mark: r.mark,
            }))))
            .catch((e) => !cancelled && setError(`Не удалось загрузить регионы: ${e.message}`))
            .finally(() => !cancelled && setRegionsLoading(false));
        return () => { cancelled = true; };
    }, []);

    // Списки УК для каждого выбранного региона — из кондуктора по mark региона
    useEffect(() => {
        const missing = form.regions
            .map((r) => regionOptions.find((o) => o.id === String(r.id)))
            .filter((o) => o && !ukCache[o.id]);
        if (!missing.length) return undefined;
        let cancelled = false;
        setUksLoading(true);
        Promise.all(missing.map((o) => api.houses(o.mark).then((d) => [o.id, (d.items || []).map((u) => ({
            id: Number(u.next_value ?? u.company_id),
            name: cleanName(u.company || u.next_text || ''),
            region_id: o.id,
            region_name: o.name,
        }))])))
            .then((pairs) => {
                if (cancelled) return;
                setUkCache((prev) => {
                    const next = { ...prev };
                    pairs.forEach(([rid, list]) => { next[rid] = list; });
                    return next;
                });
            })
            .catch((e) => !cancelled && setError(`Не удалось загрузить УК: ${e.message}`))
            .finally(() => !cancelled && setUksLoading(false));
        return () => { cancelled = true; };
    }, [form.regions, regionOptions, ukCache]);

    const ukOptions = useMemo(() => form.regions.flatMap((r) => ukCache[String(r.id)] || []), [form.regions, ukCache]);

    const selectedRegions = useMemo(() => form.regions.map((r) => ({
        id: String(r.id),
        name: r.name || regionOptions.find((o) => o.id === String(r.id))?.name || r.id,
    })), [form.regions, regionOptions]);

    const selectedUks = useMemo(() => form.uks.map((u) => ({
        id: Number(u.id),
        name: u.name || ukOptions.find((o) => o.id === Number(u.id) && o.region_id === String(u.region_id))?.name || `#${u.id}`,
        region_id: String(u.region_id),
        region_name: regionOptions.find((o) => o.id === String(u.region_id))?.name || '',
    })), [form.uks, ukOptions, regionOptions]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const err = (k) => (errors[k] ? errors[k][0] : '');

    function onRegionsChange(e, value) {
        const ids = new Set(value.map((r) => String(r.id)));
        setForm((f) => ({
            ...f,
            regions: value.map((r) => ({ id: String(r.id), name: r.name })),
            // УК регионов, которые сняли, убираем
            uks: f.uks.filter((u) => ids.has(String(u.region_id))),
        }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setError('');
        const payload = {
            login: form.login.trim(),
            name: form.name.trim(),
            role: form.role,
            is_active: Boolean(form.is_active),
            regions: form.role === 'user' ? form.regions.map((r) => ({ id: String(r.id), name: r.name || '' })) : [],
            uks: form.role === 'user' ? form.uks.map((u) => ({ id: Number(u.id), name: u.name || '', region_id: String(u.region_id) })) : [],
        };
        if (form.password) payload.password = form.password;
        try {
            if (isNew) await api.createUser(payload);
            else await api.updateUser(id, payload);
            navigate('/users');
        } catch (e2) {
            if (e2.errors) setErrors(e2.errors);
            setError(e2.errors ? Object.values(e2.errors).flat()[0] || '' : e2.message);
        } finally {
            setSaving(false);
        }
    }

    const isSelf = !isNew && me && String(me.id) === String(id);

    return (
        <>
            <HeadingBlock
                heading={isNew ? 'Новый пользователь' : 'Редактирование пользователя'}
                breadcrumbs={[{ link: '/users', name: 'Пользователи' }, { link: '', name: isNew ? 'Новый' : form.login || '…' }]}
                loading={loading}
            />

            <form onSubmit={onSubmit} noValidate>
                <CardAsu loading={loading} heading="Учётная запись">
                    <Grid item xs={10}>
                        <FormInputContainer title="Логин" direction="row" required>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={form.login}
                                onChange={(e) => set('login', e.target.value)}
                                autoComplete="off"
                                error={Boolean(err('login'))}
                                helperText={err('login') || false}
                            />
                        </FormInputContainer>
                    </Grid>
                    <Grid item xs={10}>
                        <FormInputContainer title="Имя" direction="row" required>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                error={Boolean(err('name'))}
                                helperText={err('name') || false}
                            />
                        </FormInputContainer>
                    </Grid>
                    <Grid item xs={10}>
                        <FormInputContainer title={isNew ? 'Пароль' : 'Новый пароль (пусто — не менять)'} direction="row" required={isNew}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                type="password"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={(e) => set('password', e.target.value)}
                                error={Boolean(err('password'))}
                                helperText={err('password') || false}
                            />
                        </FormInputContainer>
                    </Grid>
                    <Grid item xs={10}>
                        <FormInputContainer title="Роль" direction="row" required>
                            <TextField
                                select
                                fullWidth
                                variant="outlined"
                                value={form.role}
                                disabled={isSelf}
                                onChange={(e) => set('role', e.target.value)}
                                error={Boolean(err('role'))}
                                helperText={err('role') || false}
                            >
                                <MenuItem value="user">Пользователь (регионы / УК)</MenuItem>
                                <MenuItem value="superadmin">superadmin (все регионы)</MenuItem>
                            </TextField>
                        </FormInputContainer>
                    </Grid>

                    {form.role === 'user' ? (
                        <>
                            <Grid item xs={10}>
                                <FormInputContainer title="Регионы" direction="row" required>
                                    <Autocomplete
                                        multiple
                                        options={regionOptions}
                                        value={selectedRegions}
                                        loading={regionsLoading}
                                        getOptionLabel={(o) => o.name || o.id}
                                        isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                                        filterSelectedOptions
                                        noOptionsText="Нет вариантов"
                                        loadingText="Загрузка данных"
                                        onChange={onRegionsChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                placeholder="Выберите из списка"
                                                error={Boolean(err('regions'))}
                                                helperText={err('regions') || 'Пользователь видит все перечисленные регионы'}
                                            />
                                        )}
                                    />
                                </FormInputContainer>
                            </Grid>
                            <Grid item xs={10}>
                                <FormInputContainer title="Управляющие компании" direction="row">
                                    <Autocomplete
                                        multiple
                                        options={ukOptions}
                                        value={selectedUks}
                                        loading={uksLoading}
                                        disabled={form.regions.length === 0}
                                        groupBy={(o) => o.region_name || ''}
                                        getOptionLabel={(o) => o.name || `#${o.id}`}
                                        isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id) && String(o.region_id) === String(v.region_id)}
                                        filterSelectedOptions
                                        noOptionsText="Нет вариантов"
                                        loadingText="Загрузка данных"
                                        onChange={(e, value) => set('uks', value.map((u) => ({ id: Number(u.id), name: u.name, region_id: String(u.region_id) })))}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                placeholder={form.regions.length ? 'Выберите из списка' : 'Сначала выберите регион'}
                                                error={Boolean(err('uks'))}
                                                helperText={err('uks') || 'Пусто — пользователь видит все УК выбранных регионов. Если для региона выбраны УК, он увидит только их.'}
                                            />
                                        )}
                                    />
                                </FormInputContainer>
                            </Grid>
                        </>
                    ) : null}

                    <Grid item xs={10}>
                        <FormInputContainer title="Активен" direction="row">
                            <Switch checked={Boolean(form.is_active)} disabled={isSelf} onChange={(e) => set('is_active', e.target.checked)} />
                        </FormInputContainer>
                    </Grid>
                </CardAsu>

                {error ? <Typography color="error" sx={{ mt: 2 }}>{error}</Typography> : null}

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button type="submit" variant="contained" color="primary" disabled={saving || loading}>
                        {saving ? 'Сохранение…' : 'Сохранить'}
                    </Button>
                    <Button variant="outlined" color="primary" onClick={() => navigate('/users')}>
                        Отмена
                    </Button>
                </Box>
            </form>
        </>
    );
}
