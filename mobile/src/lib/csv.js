// Выгрузка текущего списка в CSV (разделитель ";", кодировка UTF-8 с BOM — открывается в Excel).

const COLUMNS = [
  ['address', 'Адрес'],
  ['company', 'УК'],
  ['house_cnt', 'МКД'],
  ['build_years', 'Год постройки'],
  ['floors', 'Этажность'],
  ['entrances', 'Подъездов'],
  ['elevators', 'Лифтов'],
  ['full_area', 'Площадь'],
];

function cell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv(rows, filename = 'export.csv') {
  const lines = [COLUMNS.map(([, title]) => cell(title)).join(';')];
  for (const r of rows) {
    lines.push(COLUMNS.map(([key]) => cell(r[key])).join(';'));
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
