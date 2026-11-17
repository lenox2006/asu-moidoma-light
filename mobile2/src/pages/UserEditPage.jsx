import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Check, Close } from '../components/Icons';
import NavBar from '../components/NavBar';
import { Loading } from '../components/States';
import { useAuth } from '../lib/auth';

const cleanName = (s) => (typeof s === 'string' ? s.replace(/^\[[^\]]*\]\s*/, '') : s);
const EMPTY = { login: '', name: '', password: '', role: 'user', regions: [], uks: [], is_active: true };

/** Шторка выбора нескольких значений. items: [{key, label, group?}], selected: Set(key). */
function PickSheet({ title, items, selected, onToggle, onClose, loading }) {
  const [q, setQ] = useState('');
  const rows = items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()) || (i.group || '').toLowerCase().includes(q.toLowerCase()));
  let lastGroup = null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-grip" />
        <div className="sheet-head">{title}<button type="button" className="btn-text" onClick={onClose}>Готово</button></div>
        <div style={{ padding: '0 16px 10px' }} className="search">
          <label htmlFor="pick-q" className="sr-only">Поиск</label>
          <input id="pick-q" type="search" placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {loading ? <div className="state" style={{ border: 0 }}>Загрузка данных</div> : null}
        {!loading && rows.length === 0 ? <div className="state" style={{ border: 0 }}>Нет вариантов</div> : null}
        {rows.map((i) => {
          const head = i.group && i.group !== lastGroup ? <div key={`g-${i.group}`} className="section-label" style={{ padding: '10px 16px 4px' }}>{i.group}</div> : null;
          lastGroup = i.group;
          return (
            <div key={i.key}>
              {head}
              <button type="button" className="sheet-opt" aria-pressed={selected.has(i.key)} onClick={() => onToggle(i)}>
                <span>{i.label}</span>{selected.has(i.key) ? <Check /> : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UserEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSelf = !isNew && me && String(me.id) === String(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null); // 'regions' | 'uks'

  const [regionOptions, setRegionOptions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [ukCache, setUkCache] = useState({});
  const [uksLoading, setUksLoading] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    api.users().then((list) => {
      if (cancelled) return;
      const u = (Array.isArray(list) ? list : list.data || []).find((x) => String(x.id) === String(id));
      if (!u) { setError('Пользователь не найден'); return; }
      setForm({ login: u.login, name: u.name, password: '', role: u.role, regions: u.regions || [], uks: u.uks || [], is_active: Boolean(u.is_active) });
    }).catch((e) => !cancelled && setError(e.message)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    api.houses('').then((d) => !cancelled && setRegionOptions((d.items || []).map((r) => ({ id: String(r.next_value), name: r.next_text || r.address, mark: r.mark }))))
      .catch((e) => !cancelled && setError(`Не удалось загрузить регионы: ${e.message}`))
      .finally(() => !cancelled && setRegionsLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const missing = form.regions.map((r) => regionOptions.find((o) => o.id === String(r.id))).filter((o) => o && !ukCache[o.id]);
    if (!missing.length) return undefined;
    let cancelled = false;
    setUksLoading(true);
    Promise.all(missing.map((o) => api.houses(o.mark).then((d) => [o.id, (d.items || []).map((u) => ({ id: Number(u.next_value ?? u.company_id), name: cleanName(u.company || u.next_text || ''), region_id: o.id, region_name: o.name }))])))
      .then((pairs) => !cancelled && setUkCache((prev) => { const n = { ...prev }; pairs.forEach(([k, v]) => { n[k] = v; }); return n; }))
      .catch((e) => !cancelled && setError(`Не удалось загрузить УК: ${e.message}`))
      .finally(() => !cancelled && setUksLoading(false));
    return () => { cancelled = true; };
  }, [form.regions, regionOptions, ukCache]);

  const ukOptions = useMemo(() => form.regions.flatMap((r) => ukCache[String(r.id)] || []), [form.regions, ukCache]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k) => (errors[k] ? errors[k][0] : '');

  const regionItems = regionOptions.map((o) => ({ key: o.id, label: o.name, data: o }));
  const regionSel = new Set(form.regions.map((r) => String(r.id)));
  const ukItems = ukOptions.map((u) => ({ key: `${u.region_id}:${u.id}`, label: u.name, group: u.region_name, data: u }));
  const ukSel = new Set(form.uks.map((u) => `${u.region_id}:${u.id}`));

  function toggleRegion(i) {
    setForm((f) => {
      const has = f.regions.some((r) => String(r.id) === i.key);
      const regions = has ? f.regions.filter((r) => String(r.id) !== i.key) : [...f.regions, { id: i.key, name: i.label }];
      const ids = new Set(regions.map((r) => String(r.id)));
      return { ...f, regions, uks: f.uks.filter((u) => ids.has(String(u.region_id))) };
    });
  }
  function toggleUk(i) {
    setForm((f) => {
      const has = f.uks.some((u) => `${u.region_id}:${u.id}` === i.key);
      return { ...f, uks: has ? f.uks.filter((u) => `${u.region_id}:${u.id}` !== i.key) : [...f.uks, { id: i.data.id, name: i.data.name, region_id: i.data.region_id }] };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({}); setError('');
    const payload = {
      login: form.login.trim(), name: form.name.trim(), role: form.role, is_active: Boolean(form.is_active),
      regions: form.role === 'user' ? form.regions.map((r) => ({ id: String(r.id), name: r.name || '' })) : [],
      uks: form.role === 'user' ? form.uks.map((u) => ({ id: Number(u.id), name: u.name || '', region_id: String(u.region_id) })) : [],
    };
    if (form.password) payload.password = form.password;
    try {
      if (isNew) await api.createUser(payload); else await api.updateUser(id, payload);
      navigate('/users');
    } catch (e2) {
      if (e2.errors) setErrors(e2.errors);
      setError(e2.errors ? Object.values(e2.errors).flat()[0] || '' : e2.message);
    } finally { setSaving(false); }
  }

  async function onDelete() {
    if (!window.confirm(`Удалить пользователя «${form.login}»?`)) return;
    try { await api.deleteUser(id); navigate('/users'); } catch (e2) { setError(e2.message); }
  }

  return (
    <div className="screen">
      <NavBar back="/users" title={isNew ? 'Новый пользователь' : form.name || '…'} subtitle={isNew ? 'Создание учётной записи' : 'Редактирование пользователя'}
        right={<button type="submit" form="user-form" className="btn small" style={{ height: 40 }} disabled={saving || loading}>{saving ? '…' : 'Сохранить'}</button>} />
      <main className="screen-scroll">
        {loading ? <Loading rows={3} /> : (
          <form id="user-form" onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="section-label">Учётная запись</div>
            <div className="field"><label htmlFor="login">Логин</label><input id="login" value={form.login} autoCapitalize="none" autoComplete="off" onChange={(e) => set('login', e.target.value)} />{err('login') ? <span className="err">{err('login')}</span> : null}</div>
            <div className="field"><label htmlFor="name">Имя</label><input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} />{err('name') ? <span className="err">{err('name')}</span> : null}</div>
            <div className="field"><label htmlFor="password">{isNew ? 'Пароль' : 'Новый пароль (пусто — не менять)'}</label><input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />{err('password') ? <span className="err">{err('password')}</span> : null}</div>
            <div className="field"><label htmlFor="role">Роль</label>
              <select id="role" value={form.role} disabled={isSelf} onChange={(e) => set('role', e.target.value)}>
                <option value="user">Пользователь (регионы / УК)</option>
                <option value="superadmin">superadmin (все регионы)</option>
              </select>
            </div>

            {form.role === 'user' ? (
              <>
                <div className="section-label">Область видимости</div>
                <div className="field"><span className="label">Регионы</span>
                  <div className="picker">
                    {form.regions.map((r) => <span className="chip" key={r.id}><span>{r.name || r.id}</span><button type="button" aria-label={`Убрать ${r.name}`} onClick={() => toggleRegion({ key: String(r.id), label: r.name })}><Close /></button></span>)}
                    <button type="button" className="chip-add" onClick={() => setSheet('regions')}>+ Регион</button>
                  </div>
                  <span className={err('regions') ? 'err' : 'hint'}>{err('regions') || 'Пользователь видит все перечисленные регионы.'}</span>
                </div>
                <div className="field"><span className="label">Управляющие компании</span>
                  <div className="picker">
                    {form.uks.map((u) => <span className="chip" key={`${u.region_id}:${u.id}`}><span>{u.name || `#${u.id}`}</span><button type="button" aria-label={`Убрать ${u.name}`} onClick={() => toggleUk({ key: `${u.region_id}:${u.id}` })}><Close /></button></span>)}
                    <button type="button" className="chip-add" disabled={!form.regions.length} onClick={() => setSheet('uks')}>+ УК</button>
                  </div>
                  <span className={err('uks') ? 'err' : 'hint'}>{err('uks') || 'Пусто — все УК выбранных регионов. Если для региона выбраны УК, он увидит только их.'}</span>
                </div>
              </>
            ) : null}

            <label className="switch-row">Активен<span className="switch"><input type="checkbox" checked={Boolean(form.is_active)} disabled={isSelf} onChange={(e) => set('is_active', e.target.checked)} /><span className="track" /></span></label>
            {error ? <div className="error-card" role="alert"><div className="error-text" style={{ marginTop: 0 }}>{error}</div></div> : null}
            {!isNew && !isSelf ? <button type="button" className="btn danger" onClick={onDelete}>Удалить пользователя</button> : null}
          </form>
        )}
      </main>

      {sheet === 'regions' ? <PickSheet title="Регионы" items={regionItems} selected={regionSel} onToggle={toggleRegion} onClose={() => setSheet(null)} loading={regionsLoading} /> : null}
      {sheet === 'uks' ? <PickSheet title="Управляющие компании" items={ukItems} selected={ukSel} onToggle={toggleUk} onClose={() => setSheet(null)} loading={uksLoading} /> : null}
    </div>
  );
}
