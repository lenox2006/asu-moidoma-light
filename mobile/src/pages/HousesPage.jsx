import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Check, Chevron, Export, Filter } from '../components/Icons';
import NavBar from '../components/NavBar';
import SearchField from '../components/SearchField';
import { EmptyState, ErrorCard, Loading } from '../components/States';
import TabBar from '../components/TabBar';
import { useAuth } from '../lib/auth';
import { getCrumbs, rememberCrumbs } from '../lib/crumbs';
import { exportCsv } from '../lib/csv';
import { fmtArea, fmtInt, LEVEL_TITLES } from '../lib/format';

/**
 * Один экран для всех уровней: Регионы → УК → Улицы → Дома.
 * Уровень определяется `mark` в URL (пусто = стартовый уровень пользователя).
 */

const UK_TABS = [['our', 'Обслуживаемые'], ['gone', 'Ушедшие'], ['foreign', 'Сторонние'], ['all', 'Все УК']];

function ukStatus(row) {
  const m = typeof row.company === 'string' ? row.company.match(/^\[([^\]]*)\]/) : null;
  if (!m) return 'our';
  const t = m[1].toLowerCase();
  if (t.startsWith('ушед')) return 'gone';
  if (t.startsWith('сторон')) return 'foreign';
  return 'other';
}

const isHouseRow = (row, level) => row.next_level === 'house' || row.next_level === 'card' || !row.next_level
  || row.build_id !== undefined || row.buildId !== undefined || level === 'house' || level === 'card';

export default function HousesPage() {
  const { start } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mark = params.has('mark') ? params.get('mark') || '' : start.mark || '';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ukTab, setUkTab] = useState('our');
  const [sheet, setSheet] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [reload, setReload] = useState(0);

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
    api.houses(mark)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [mark, reload]);

  const level = data?.level || null;
  const items = data?.items || [];
  const isUk = level === 'uk';
  const isHouses = level === 'house' || level === 'card';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = items;
    if (isUk && ukTab !== 'all') rows = rows.filter((r) => ukStatus(r) === ukTab);
    if (!q) return rows;
    return rows.filter((r) => [r.address, r.company, r.next_text, r.build_years].filter((v) => v != null).some((v) => String(v).toLowerCase().includes(q)));
  }, [items, search, isUk, ukTab]);

  const counts = useMemo(() => {
    const c = { our: 0, gone: 0, foreign: 0, other: 0, all: items.length };
    if (isUk) items.forEach((r) => { c[ukStatus(r)] += 1; });
    return c;
  }, [items, isUk]);

  const totals = useMemo(() => filtered.reduce((t, r) => ({
    mkd: t.mkd + (Number(r.house_cnt) || 0),
    area: t.area + (Number(r.full_area) || 0),
  }), { mkd: 0, area: 0 }), [filtered]);

  function goTo(nextMark, nextCrumbs) {
    rememberCrumbs(nextMark, nextCrumbs);
    setParams({ mark: nextMark });
  }

  function open(row) {
    if (isHouseRow(row, level)) {
      const buildId = row.build_id ?? row.buildId ?? row.next_value ?? row.id ?? row.house_id;
      if (buildId == null || buildId === '') { setError('В строке дома нет идентификатора (build_id)'); return; }
      // Крошку дома под mark списка НЕ записываем (иначе она затирает цепочку улицы).
      // Карточке передаём mark дома (для проверки прав) и mark списка (для возврата и крошек).
      const rowMark = row.mark || mark;
      navigate(`/house?build_id=${encodeURIComponent(buildId)}&mark=${encodeURIComponent(rowMark)}&list=${encodeURIComponent(mark)}&address=${encodeURIComponent(row.address || row.next_text || '')}`, { state: { row } });
      return;
    }
    if (!row.mark || row.mark === mark) return;
    goTo(row.mark, [...crumbs, { level: row.next_level, text: row.next_text || row.address, mark: row.mark }]);
  }

  const last = crumbs[crumbs.length - 1];
  const title = last ? last.text.replace(/^\[[^\]]*\]\s*/, '') : 'Мои дома';
  const subtitle = `${level ? LEVEL_TITLES[level] || level : '…'}${loading ? '' : ` · ${filtered.length}`}`;
  const canBack = crumbs.length > startLen;
  const goBack = () => { const kept = crumbs.slice(0, -1); goTo(kept.length ? kept[kept.length - 1].mark : start.mark || '', kept); };

  return (
    <div className="screen">
      <NavBar
        brand={!canBack}
        title={title}
        subtitle={subtitle}
        back={canBack}
        onBack={goBack}
        right={isUk
          ? <button type="button" className="icon-btn" aria-label="Фильтр по статусу УК" onClick={() => setSheet(true)}><Filter />{ukTab !== 'all' ? <span className="badge">1</span> : null}</button>
          : <button type="button" className="icon-btn" aria-label="Выгрузить список" disabled={!filtered.length} onClick={() => exportCsv(filtered, `asu-light-${level || 'list'}.csv`)}><Export /></button>}
      >
        <SearchField value={search} onChange={setSearch} placeholder={isHouses ? 'Поиск по номеру дома' : isUk ? 'Поиск по названию УК' : 'Поиск'} />
        {crumbs.length > 0 ? (
          <div className="hscroll" aria-label="Путь">
            {crumbs.map((c, i) => (
              <button type="button" key={c.mark || i} className={`crumb${i === crumbs.length - 1 ? ' current' : ''}`} disabled={i === crumbs.length - 1} onClick={() => goTo(c.mark, crumbs.slice(0, i + 1))}>
                {c.text.replace(/^\[[^\]]*\]\s*/, '')}
              </button>
            ))}
          </div>
        ) : null}
        {isUk ? (
          <div className="hscroll" role="group" aria-label="Статус УК">
            {UK_TABS.map(([k, t]) => <button type="button" key={k} className="segment" aria-pressed={ukTab === k} onClick={() => setUkTab(k)}>{t} · {counts[k]}</button>)}
          </div>
        ) : null}
      </NavBar>

      <main className="screen-scroll has-tabbar">
        {!loading && !error ? (
          <div className="list-meta">
            <div>Найдено: <b>{filtered.length}</b></div>
            {showTotals && filtered.length ? <div>Итого: <b>{fmtInt(totals.mkd) || 0} МКД{totals.area ? ` · ${fmtArea(totals.area)} м²` : ''}</b></div> : null}
          </div>
        ) : null}

        {error ? <ErrorCard message={error} onRetry={() => setReload((n) => n + 1)} /> : null}
        {loading ? <Loading /> : null}
        {!loading && !error && filtered.length === 0 ? (
          <EmptyState action={search || (isUk && ukTab !== 'our') ? <button type="button" className="btn outline small" style={{ marginTop: 6 }} onClick={() => { setSearch(''); setUkTab('our'); }}>Сбросить фильтр</button> : null} />
        ) : null}

        {!loading && !error ? filtered.map((r, i) => (
          <button type="button" className="row" key={r.mark || r.next_value || i} onClick={() => open(r)}>
            <div className="row-body">
              <div className="row-title">{(r.address || r.next_text || '').replace(/^\[[^\]]*\]\s*/, '')}{level === 'uk' && typeof r.company === 'string' ? '' : ''}</div>
              {level === 'region' ? (
                <div className="row-meta"><span>УК: <b>{fmtInt(r.company) || 0}</b></span><span>МКД: <b>{fmtInt(r.house_cnt) || 0}</b></span><span>Площадь: <b>{fmtArea(r.full_area) || '—'}</b></span></div>
              ) : (
                <>
                  {level === 'uk' && typeof r.company === 'string' ? <div className="row-meta" style={{ marginTop: -2 }}>{r.company}</div> : null}
                  <div className="tags">
                    {isHouses
                      ? <><span className="tag accent">{r.build_years || '—'} г.</span><span className="tag">{r.floors || '—'} эт.</span><span className="tag">{fmtInt(r.entrances) || 0} под. · {fmtInt(r.elevators) || 0} лифт.</span><span className="tag">{fmtArea(r.full_area) || '—'} м²</span></>
                      : <><span className="tag accent">{fmtInt(r.house_cnt) || 0} МКД</span>{r.build_years ? <span className="tag">{r.build_years}</span> : null}{r.floors ? <span className="tag">{r.floors} эт.</span> : null}{r.full_area ? <span className="tag">{fmtArea(r.full_area)} м²</span> : null}</>}
                  </div>
                </>
              )}
            </div>
            <span className="chev"><Chevron /></span>
          </button>
        )) : null}
      </main>

      {sheet ? (
        <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="sheet" role="dialog" aria-label="Фильтр УК">
            <div className="sheet-grip" />
            <div className="sheet-head">Статус УК<button type="button" className="btn-text" onClick={() => setUkTab('our')}>Сбросить</button></div>
            {UK_TABS.map(([k, t]) => (
              <button type="button" key={k} className="sheet-opt" aria-pressed={ukTab === k} onClick={() => setUkTab(k)}>
                <span>{t} <small>· {counts[k]}</small></span>{ukTab === k ? <Check /> : null}
              </button>
            ))}
            <div className="sheet-foot">
              <label className="switch-row" style={{ border: 0, padding: '0 2px' }}>
                Показывать сводные итоги
                <span className="switch"><input type="checkbox" checked={showTotals} onChange={(e) => setShowTotals(e.target.checked)} /><span className="track" /></span>
              </label>
              <button type="button" className="btn" style={{ height: 52 }} onClick={() => setSheet(false)}>Показать {counts[ukTab]} УК</button>
            </div>
          </div>
        </div>
      ) : null}

      <TabBar />
    </div>
  );
}
