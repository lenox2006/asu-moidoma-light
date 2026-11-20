import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import NavBar from '../components/NavBar';
import { ErrorCard, Loading } from '../components/States';
import { useAuth } from '../lib/auth';
import { getCrumbs } from '../lib/crumbs';
import { BILLING, dict, MANAGEMENT_TYPE, UK_BRANCH } from '../lib/dictionaries';
import { fmtAreaExact, fmtIntZero, fmtText } from '../lib/format';

/* Поля getHouseById — см. веб-версию (frontend/src/pages/HouseCardPage.jsx), логика идентична. */

function flatten(obj, prefix = '', out = {}) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = v;
  });
  return out;
}
function findKey(obj, key) {
  const want = key.toLowerCase();
  const keys = Object.keys(obj);
  return keys.find((k) => k.toLowerCase() === want) || keys.find((k) => k.toLowerCase().endsWith(`.${want}`)) || null;
}
function pick(sources, ...keys) {
  for (const obj of sources) {
    if (!obj) continue;
    for (const k of keys) {
      const real = findKey(obj, k);
      if (real !== null) { const v = obj[real]; if (v !== undefined && v !== null && v !== '') return v; }
    }
  }
  return null;
}
const num = (v) => { if (v == null || v === '') return null; const n = Number(String(v).replace(',', '.')); return Number.isNaN(n) ? null : n; };
function fmtDate(v) {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('ru-RU');
}
function fmtYear(v) {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  if (/^\d{4}$/.test(s)) return s;
  let m = s.match(/^(\d{4})-\d{2}-\d{2}/); if (m) return m[1];
  m = s.match(/^\d{2}\.\d{2}\.(\d{4})/); if (m) return m[1];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : String(d.getFullYear());
}
function splitAddress(address) {
  if (!address) return { short: '', city: '' };
  const parts = String(address).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return { short: address, city: '' };
  return { short: parts.slice(-2).join(', '), city: parts.slice(0, -2).join(', ') };
}

function Field({ label, value }) {
  const empty = value == null || value === '' || value === '—';
  return <div className="field"><span className="label">{label}</span><div className={`value${empty ? ' empty' : ''}`}>{empty ? '—' : String(value)}</div></div>;
}

export default function HouseCardPage() {
  const { start } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mark = params.get('mark') || '';
  const buildId = params.get('build_id') || '';
  const row = location.state?.row || (params.get('address') ? { address: params.get('address') } : null);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    if (!buildId) { setError('Не указан идентификатор дома'); setLoading(false); return undefined; }
    api.houseCard(buildId, mark)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [buildId, mark, reload]);

  const src = useMemo(() => [flatten((data && data.house) || {}), row || {}], [data, row]);
  // mark списка домов, откуда открыта карточка: явно из URL (list=…), иначе — по сохранённой цепочке.
  const listMark = params.has('list') ? params.get('list') || '' : (() => {
    const c = getCrumbs(mark, start.crumbs || []);
    const last = c[c.length - 1];
    return last && (last.level === 'house' || last.level === 'card') && c.length > 1 ? c[c.length - 2].mark : mark;
  })();
  const parent = useMemo(() => {
    const c = [...getCrumbs(listMark, start.crumbs || [])];
    while (c.length && (c[c.length - 1].level === 'house' || c[c.length - 1].level === 'card') && c[c.length - 1].mark === listMark) c.pop();
    return c;
  }, [listMark, start.crumbs]);
  const listLink = `/houses?mark=${encodeURIComponent(listMark)}`;

  const address = pick(src, 'address', 'full_address', 'ADDRESS');
  const { short, city } = splitAddress(address);
  const companyValue = pick(src, 'UKNAME', 'company', 'company_name', 'uk_name');
  const company = typeof companyValue === 'string' ? companyValue.replace(/^\[[^\]]*\]\s*/, '') : companyValue;

  const flats = pick(src, 'FLATS');
  const livingArea = num(pick(src, 'LIVINGAREA'));
  const nonFlats = pick(src, 'NonFlats');
  const nonLivingArea = num(pick(src, 'NONLIVINGAREA'));
  const mop = num(pick(src, 'MOP', 'mop_area', 'MOPAREA'));
  const premises = livingArea === null && nonLivingArea === null ? null : (livingArea || 0) + (nonLivingArea || 0);
  const total = livingArea === null && nonLivingArea === null && mop === null ? null : (livingArea || 0) + (nonLivingArea || 0) + (mop || 0);
  const basis = pick(src, 'BASIS_MANAGEMENT', 'MAINTENANCE_BASIS', 'management_basis');

  const ready = !loading || row;

  return (
    <div className="screen">
      <NavBar
        back
        onBack={() => navigate(listLink)}
        title={<span style={{ color: 'var(--color-accent)' }}>{short || 'Дом'}</span>}
        subtitle={[city, company].filter(Boolean).join(' · ')}
      >
        <div className="tabs"><div className="tab">Общие сведения</div></div>
      </NavBar>

      <main className="screen-scroll">
        {error ? <ErrorCard message={error} onRetry={() => setReload((n) => n + 1)} /> : null}
        {!ready ? <Loading rows={3} /> : null}

        {ready ? (
          <>
            <div className="card grid3" style={{ padding: '14px 16px' }}>
              <div className="stat"><b>{fmtText(pick(src, 'minLevels', 'floors', 'FLOORS'))}</b><span>этажей</span></div>
              <div className="stat"><b>{fmtIntZero(pick(src, 'ENTRANCE_COUNT', 'entrances', 'ENTRANCES'))}</b><span>подъездов</span></div>
              <div className="stat"><b>{fmtIntZero(pick(src, 'ELEVATOR_COUNT', 'elevators', 'ELEVATORS'))}</b><span>лифтов</span></div>
            </div>

            <section className="card" aria-label="Помещения">
              <div className="card-head">Жилые помещения</div>
              <div className="grid2"><Field label="Количество" value={fmtIntZero(flats)} /><Field label="Площадь, м²" value={fmtAreaExact(livingArea)} /></div>
              <div className="card-head" style={{ marginTop: 4 }}>Нежилые помещения</div>
              <div className="grid2"><Field label="Количество" value={fmtIntZero(nonFlats)} /><Field label="Площадь, м²" value={fmtAreaExact(nonLivingArea)} /></div>
              <Field label="Общая площадь объекта, м²" value={fmtAreaExact(total)} />
              <Field label="Площадь жилых и нежилых помещений, м²" value={fmtAreaExact(premises)} />
              <Field label="Общая площадь МОП, м²" value={fmtAreaExact(mop)} />
            </section>

            <section className="card" aria-label="Управляющая компания">
              <div className="card-head">Управляющая компания</div>
              <Field label="Наименование" value={company} />
              <div className="grid2">
                <Field label="Дата начала управления" value={fmtDate(pick(src, 'MAINTENANCE_ENTRYDATE'))} />
                <Field label="Вид обслуживания" value={fmtText(dict(MANAGEMENT_TYPE, pick(src, 'management_type_id', 'MANAGEMENT_TYPE_ID')))} />
              </div>
              <Field label="Основание для управления" value={basis == null || basis === '' ? 'Не определено' : fmtText(basis)} />
              <Field label="Филиал" value={fmtText(dict(UK_BRANCH, pick(src, 'UK_BRANCH_ID', 'uk_branch_id')))} />
            </section>

            <section className="card" aria-label="Сведения об объекте">
              <div className="card-head">Сведения об объекте</div>
              <div className="grid2">
                <Field label="Год постройки" value={fmtText(pick(src, 'build_years', 'BUILDYEAR', 'build_year', 'BUILDDATE'))} />
                <Field label="Год ввода в эксплуатацию" value={fmtYear(pick(src, 'buildEntryDate'))} />
                <Field label="Серия проекта" value={fmtText(pick(src, 'PROJECT_SERIES', 'project_series'))} />
                <Field label="Тип проекта" value={fmtText(pick(src, 'PROJECT_TYPE', 'project_type'))} />
                <Field label="Тип объекта" value={pick(src, 'OBJECTTYPE', 'object_type', 'HOUSETYPE') || 'МКД'} />
              </div>
            </section>

            <section className="card" aria-label="Расчётный центр">
              <div className="card-head">Расчётный центр</div>
              <Field label="Биллинг" value={fmtText(dict(BILLING, pick(src, 'BILLING_ID', 'billing_id')))} />
            </section>

            <button type="button" className="btn outline" onClick={() => navigate(listLink)}>К списку домов</button>
          </>
        ) : null}
      </main>
    </div>
  );
}
