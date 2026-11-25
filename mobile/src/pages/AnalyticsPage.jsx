import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { BalanceBar, DeltaChart, MiniBar } from '../components/AnalyticsChart';
import Calendar, { toIso } from '../components/Calendar';
import { Filter } from '../components/Icons';
import NavBar from '../components/NavBar';
import { EmptyState, ErrorCard, Loading } from '../components/States';
import TabBar from '../components/TabBar';
import {
  autoStep, bucketLabel, fmtDate, fmtDelta, fmtMetric, GROUPINGS, grouping, METRICS,
  metricFields, netDelta, PERIODS, periodLabel, REPORTS, shortRegion, STEPS, toArray,
} from '../lib/analytics';
import { orgCase } from '../lib/format';

const PREFS_KEY = 'asu_light_analytics';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const loadPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

/**
 * Вкладка «Аналитика: движение жилого фонда».
 * Три отчёта по одним данным: «Сводка», «Сравнение регионов», «Тренд».
 * Источник — GET /api/analytics/housing-movement (метод analyticsHousingMoving кондуктора).
 */
export default function AnalyticsPage() {
  const prefs = useMemo(loadPrefs, []);
  const [report, setReport] = useState(prefs.report || 'summary');
  const [period, setPeriod] = useState(prefs.period || 'month');
  const [step, setStep] = useState(prefs.step || 'week');
  const [range, setRange] = useState(prefs.range || { from: '', to: '' });
  const [metric, setMetric] = useState(prefs.metric || 'houses');
  const [groupBy, setGroupBy] = useState(prefs.groupBy || 'region');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ report, period, step, metric, groupBy, range }));
  }, [report, period, step, metric, groupBy, range]);

  const load = useCallback(async () => {
    if (period === 'custom' && !(DATE_RE.test(range.from) && DATE_RE.test(range.to))) {
      setError({ message: 'Укажите даты периода' });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.analytics({
        period,
        step: period === 'custom' ? autoStep(range.from, range.to) : step,
        group_by: groupBy,
        include: 'series',
        ...(period === 'custom' ? { from: range.from, to: range.to } : {}),
      });
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [period, step, groupBy, range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(
    () => toArray(data?.groups).map((g) => ({ ...g, name: orgCase(g.name), top_uks: toArray(g.top_uks) })),
    [data],
  );
  const summary = data?.summary || {};
  const g = grouping(groupBy);

  const openSheet = () => { setDraft({ period, step, range }); setSheet(true); };
  const applySheet = () => {
    setPeriod(draft.period);
    setStep(draft.step);
    setRange(draft.range);
    setSheet(false);
  };

  return (
    <div className="screen">
      <NavBar
        title="Аналитика"
        subtitle={data?.period ? `${periodLabel(data.period)} · ${g.title.toLowerCase()}` : 'Движение жилого фонда'}
        right={<button type="button" className="icon-btn" aria-label="Период отчёта" onClick={openSheet}><Filter /></button>}
      >
        <div className="segments">
          {REPORTS.map((r) => (
            <button key={r.key} type="button" className="segment" aria-pressed={report === r.key} onClick={() => setReport(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </NavBar>

      <main className="screen-scroll has-tabbar" style={{ gap: 12 }}>
        {report !== 'trend' ? (
          <div className="switch">
            {GROUPINGS.map((x) => (
              <button key={x.key} type="button" className={groupBy === x.key ? 'on' : ''} onClick={() => setGroupBy(x.key)}>{x.short}</button>
            ))}
          </div>
        ) : null}

        {loading ? <Loading rows={3} />
          : error ? <ErrorCard message={error.message} onRetry={load} />
            : groups.length === 0 ? <EmptyState title="Нет данных за период" text="Измените период отчёта" />
              : (
                <>
                  {report === 'summary' ? <SummaryReport summary={summary} groups={groups} period={data?.period} grp={g} /> : null}
                  {report === 'regions' ? <RegionsReport summary={summary} groups={groups} grp={g} /> : null}
                  {report === 'trend' ? (
                    <TrendReport
                      summary={summary}
                      groups={groups}
                      series={toArray(data?.series)}
                      step={data?.period?.step || step}
                      metric={metric}
                      onMetric={setMetric}
                      groupBy={groupBy}
                      onGroupBy={setGroupBy}
                    />
                  ) : null}
                </>
              )}
      </main>

      {sheet ? (
        <PeriodSheet draft={draft} setDraft={setDraft} onClose={() => setSheet(false)} onApply={applySheet} />
      ) : null}

      <TabBar />
    </div>
  );
}

/* ---------- Отчёт 1: «Сводка» ---------- */

function SummaryReport({ summary, groups, period, grp }) {
  const chart = groups.map((x) => ({
    key: x.id, label: shortRegion(x.name), in: x.area_in, out: x.area_out, delta: netDelta(x, 'area'),
  }));
  const sorted = [...groups].sort((a, b) => Math.abs(netDelta(b, 'area')) - Math.abs(netDelta(a, 'area')));

  return (
    <>
      <div className="kpi-grid">
        <Kpi label="Обслуживаемая площадь" value={fmtMetric(summary.area_total, 'area')} sub={fmtDelta(netDelta(summary, 'area'), 'area')} subTone={tone(netDelta(summary, 'area'))} />
        <Kpi label="Домов в обслуживании" value={fmtMetric(summary.houses_total, 'houses')} sub={fmtDelta(netDelta(summary, 'houses'), 'houses')} subTone={tone(netDelta(summary, 'houses'))} />
        <Kpi tone="green" label="Пришло" value={fmtDelta(summary.area_in, 'area')} sub={`${summary.houses_in || 0} д.`} />
        <Kpi tone="red" label="Ушло" value={fmtDelta(-Math.abs(summary.area_out || 0), 'area')} sub={`${summary.houses_out || 0} д.`} />
      </div>

      <section className="card">
        <div className="card-head">Изменение площади: {grp.title.toLowerCase()}</div>
        <DeltaChart items={chart} unit="м²" />
      </section>

      <section className="card list-card">
        <div className="list-card-head">{grp.title}</div>
        {sorted.map((x) => (
          <div className="list-row" key={x.id}>
            <div className="list-row-body">
              <div className="list-row-title">{x.name}</div>
              <div className="list-row-sub">{fmtMetric(x.area_total, 'area')} · {x.houses_total || 0} домов</div>
            </div>
            <div className="list-row-values">
              <b className={tone(netDelta(x, 'area'))}>{fmtDelta(netDelta(x, 'area'), 'area')}</b>
              <span className={tone(netDelta(x, 'houses'))}>{fmtDelta(netDelta(x, 'houses'), 'houses')}</span>
            </div>
          </div>
        ))}
        <div className="list-total">
          <span>Итого · {groups.length} {grp.key === 'uk' ? 'УК' : 'рег.'}</span>
          <b className={tone(netDelta(summary, 'area'))}>
            {fmtDelta(netDelta(summary, 'area'), 'area')} · {fmtDelta(netDelta(summary, 'houses'), 'houses')}
          </b>
        </div>
      </section>

      {period?.as_of ? (
        <p className="note">Остатки — на {fmtDate(period.as_of)}. Переходы между УК внутри холдинга не учитываются.</p>
      ) : null}
    </>
  );
}

/* ---------- Отчёт 2: «Сравнение регионов» ---------- */

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'changed', label: 'С изменениями' },
  { key: 'up', label: 'Рост' },
  { key: 'down', label: 'Убыль' },
];

function RegionsReport({ summary, groups, grp }) {
  const [filter, setFilter] = useState('all');

  const list = groups.filter((x) => {
    const d = netDelta(x, 'area');
    const moved = d !== 0 || (x.area_in || 0) !== 0 || (x.area_out || 0) !== 0;
    if (filter === 'changed') return moved;
    if (filter === 'up') return d > 0;
    if (filter === 'down') return d < 0;
    return true;
  }).sort((a, b) => netDelta(a, 'area') - netDelta(b, 'area'));

  const max = Math.max(1, ...groups.map((x) => Math.max(Math.abs(x.area_in || 0), Math.abs(x.area_out || 0))));

  return (
    <>
      <section className="card">
        <div className="card-row">
          <span className="muted">Всего в обслуживании</span>
          <span className="muted">{groups.length} {grp.key === 'uk' ? 'УК' : 'регионов'}</span>
        </div>
        <div className="card-row totals">
          <div><b>{fmtMetric(summary.area_total, 'area')}</b></div>
          <div><b>{summary.houses_total || 0}</b><span className="muted"> домов</span></div>
        </div>
        <BalanceBar inValue={summary.area_in} outValue={summary.area_out} />
        <div className="card-row">
          <b className="green">{fmtDelta(summary.area_in, 'area')} · {summary.houses_in || 0} д.</b>
          <b className="red">{fmtDelta(-Math.abs(summary.area_out || 0), 'area')} · {summary.houses_out || 0} д.</b>
        </div>
      </section>

      <div className="segments">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="segment" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card"><span className="muted">За период движения не было.</span></div>
      ) : list.map((x) => (
        <section className="card" key={x.id}>
          <div className="card-row">
            <div style={{ minWidth: 0 }}>
              <div className="group-title">{x.name}</div>
              <div className="muted small">
                {fmtMetric(x.area_total, 'area')} · {x.houses_total || 0} домов{grp.key === 'region' ? ` · ${x.top_uks.length} УК` : ''}
              </div>
            </div>
            <span className={`badge ${tone(netDelta(x, 'area'))}`}>{fmtDelta(netDelta(x, 'area'), 'area')}</span>
          </div>

          <div className="minibars">
            <MiniBar label="пришло" tone="green" share={Math.abs(x.area_in || 0) / max} value={fmtDelta(x.area_in, 'area')} />
            <MiniBar label="ушло" tone="red" share={Math.abs(x.area_out || 0) / max} value={fmtDelta(-Math.abs(x.area_out || 0), 'area')} />
          </div>

          <div className="card-row">
            <span className="muted small uk-line">
              {grp.key === 'uk' ? 'изменение за период'
                : x.top_uks.length ? x.top_uks.slice(0, 3).map((u) => orgCase(u.name)).join(' · ') : 'УК не указаны'}
            </span>
            <b className={`small ${tone(netDelta(x, 'houses'))}`}>{fmtDelta(netDelta(x, 'houses'), 'houses')}</b>
          </div>
        </section>
      ))}
    </>
  );
}

/* ---------- Отчёт 3: «Тренд» ---------- */

function TrendReport({ summary, groups, series, step, metric, onMetric, groupBy, onGroupBy }) {
  const f = metricFields(metric);
  const chart = series.map((s, i) => ({
    key: s.bucket || i, label: bucketLabel(s, step), in: s[f.in], out: s[f.out], delta: netDelta(s, metric),
  }));
  const suspicious = series.some((x) => (
    Math.max(Number(x.houses_in) || 0, Number(x.houses_out) || 0) > (Number(summary.houses_total) || 0)
  ));
  const rows = [...groups]
    .map((x) => ({ key: x.id, name: x.name, sub: `${fmtMetric(x[f.total], metric)} в обслуживании`, delta: netDelta(x, metric) }))
    .sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0));

  return (
    <>
      <section className="card">
        <span className="muted">Баланс за период</span>
        <div className="card-row balance-row">
          <b className={`xxl ${tone(netDelta(summary, 'area'))}`}>{fmtDelta(netDelta(summary, 'area'), 'area')}</b>
          <b className={tone(netDelta(summary, 'houses'))}>{fmtDelta(netDelta(summary, 'houses'), 'houses')}</b>
        </div>
        <div className="kpi-grid two">
          <Kpi flat tone="green" label="Пришло" value={fmtDelta(summary.area_in, 'area')} sub={`${summary.houses_in || 0} д.`} />
          <Kpi flat tone="red" label="Ушло" value={fmtDelta(-Math.abs(summary.area_out || 0), 'area')} sub={`${summary.houses_out || 0} д.`} />
        </div>
      </section>

      <section className="card">
        <div className="card-head">Динамика по периодам</div>
        {chart.length ? <DeltaChart items={chart} unit={metric === 'area' ? 'м²' : 'домов'} colWidth={48} />
          : <span className="muted">Кондуктор не вернул ряд по периодам для этого шага.</span>}
        {chart.length && suspicious ? (
          <p className="note">Ряд по периодам выглядит некорректным: движение превышает весь фонд. Проверьте расчёт на стороне кондуктора.</p>
        ) : null}
      </section>

      <div className="tabs">
        {GROUPINGS.map((x) => (
          <button key={x.key} type="button" className={groupBy === x.key ? 'on' : ''} onClick={() => onGroupBy(x.key)}>{x.label}</button>
        ))}
      </div>

      <div className="switch">
        {METRICS.map((m) => (
          <button key={m.key} type="button" className={metric === m.key ? 'on' : ''} onClick={() => onMetric(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      <section className="card list-card">
        {rows.map((r) => (
          <div className="list-row" key={r.key}>
            <div className="list-row-body">
              <div className="list-row-title">{r.name}</div>
              <div className="list-row-sub">{r.sub}</div>
            </div>
            <span className={`badge ${tone(r.delta)}`}>{fmtDelta(r.delta, metric)}</span>
          </div>
        ))}
      </section>
    </>
  );
}

/* ---------- Общие части ---------- */

function Kpi({ label, value, sub, subTone, tone: box, flat }) {
  return (
    <div className={`kpi${box ? ` ${box}` : ''}${flat ? ' flat' : ''}`}>
      <span className="kpi-label">{label}</span>
      <b className="kpi-value">{value}</b>
      {sub ? <span className={`kpi-sub ${subTone || ''}`}>{sub}</span> : null}
    </div>
  );
}

function PeriodSheet({ draft, setDraft, onClose, onApply }) {
  const [edit, setEdit] = useState('from');
  const custom = draft.period === 'custom';
  const { from, to } = draft.range;
  const valid = !custom || (DATE_RE.test(from) && DATE_RE.test(to) && from <= to);

  const pickDate = (iso) => {
    const range = edit === 'from'
      ? { from: iso, to: to && to >= iso ? to : iso }
      : { from: from && from <= iso ? from : iso, to: iso };
    setDraft({ ...draft, period: 'custom', range });
    if (edit === 'from') setEdit('to');
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <span>Период отчёта</span>
          <button type="button" className="btn-text" onClick={onClose}>Закрыть</button>
        </div>

        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className="sheet-opt"
            aria-pressed={draft.period === p.key}
            onClick={() => setDraft({
              ...draft,
              period: p.key,
              step: p.key === 'custom' ? autoStep(from, to) : p.step,
              range: p.key === 'custom' && !(from && to) ? defaultRange() : draft.range,
            })}
          >
            <span>{p.title}<i className="opt-sub">{p.sub}</i></span>
            {draft.period === p.key ? <b className="opt-check">✓</b> : null}
          </button>
        ))}

        {custom ? (
          <div className="sheet-body">
            <div className="date-picks">
              {[['from', 'с'], ['to', 'по']].map(([key, label]) => (
                <button key={key} type="button" className={`date-pick${edit === key ? ' on' : ''}`} onClick={() => setEdit(key)}>
                  <span>{label}</span>
                  <b>{draft.range[key] ? fmtDate(draft.range[key]) : 'выберите дату'}</b>
                </button>
              ))}
            </div>
            <Calendar
              value={draft.range[edit]}
              onChange={pickDate}
              min={edit === 'to' ? from : undefined}
              max={edit === 'from' ? to : undefined}
            />
            {!valid ? <p className="err">Дата «с» должна быть не позже даты «по»</p> : null}
          </div>
        ) : (
          <div className="sheet-body">
            <span className="muted small">Шаг графика в отчёте «Тренд»</span>
            <div className="segments" style={{ marginTop: 8 }}>
              {STEPS.map((s) => (
                <button key={s.key} type="button" className="segment" aria-pressed={draft.step === s.key} onClick={() => setDraft({ ...draft, step: s.key })}>{s.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="sheet-foot">
          <button type="button" className="btn" disabled={!valid} onClick={onApply}>Применить</button>
        </div>
      </div>
    </div>
  );
}

/** По умолчанию для произвольного периода — текущий месяц. */
function defaultRange() {
  const now = new Date();
  return { from: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIso(now) };
}

const tone = (v) => ((Number(v) || 0) > 0 ? 'green' : (Number(v) || 0) < 0 ? 'red' : 'muted');
