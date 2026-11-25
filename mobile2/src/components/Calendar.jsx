import { useMemo, useState } from 'react';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const pad = (n) => String(n).padStart(2, '0');
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Календарь на месяц для выбора произвольного периода.
 * value и результат onChange — строка «ГГГГ-ММ-ДД», как ждёт метод analyticsHousingMoving.
 */
export default function Calendar({ value, onChange, min, max }) {
  const selected = fromIso(value);
  const [view, setView] = useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const minDate = fromIso(min);
  const maxDate = fromIso(max);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const shift = (first.getDay() + 6) % 7;             // неделя с понедельника
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out = Array(shift).fill(null);
    for (let d = 1; d <= days; d += 1) out.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [view]);

  const shiftMonth = (delta) => setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  const disabled = (d) => (minDate && d < minDate) || (maxDate && d > maxDate);

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="calendar-nav" aria-label="Предыдущий месяц" onClick={() => shiftMonth(-1)}>‹</button>
        <div className="calendar-title">{MONTHS[view.getMonth()]} {view.getFullYear()}</div>
        <button type="button" className="calendar-nav" aria-label="Следующий месяц" onClick={() => shiftMonth(1)}>›</button>
      </div>
      <div className="calendar-grid weekdays">
        {WEEKDAYS.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
      </div>
      <div className="calendar-grid">
        {cells.map((d, i) => (d ? (
          <button
            key={toIso(d)}
            type="button"
            className={`calendar-day${selected && toIso(d) === toIso(selected) ? ' selected' : ''}`}
            disabled={disabled(d)}
            onClick={() => onChange(toIso(d))}
          >
            {d.getDate()}
          </button>
        ) : <div key={`e${i}`} className="calendar-day empty" />))}
      </div>
    </div>
  );
}
