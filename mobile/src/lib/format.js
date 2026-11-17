// Форматирование чисел в стиле основной системы: 2 098 241

const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function fmtInt(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n === 0 ? '' : nf0.format(n);
}

export function fmtIntZero(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : nf0.format(n);
}

export function fmtArea(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n === 0 ? '' : nf0.format(Math.round(n));
}

export function fmtAreaExact(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : nf2.format(n);
}

export function fmtText(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Да' : 'Нет';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

/** Подписи уровней навигации кондуктора. */
export const LEVEL_TITLES = {
  region: 'Регионы',
  uk: 'Управляющие компании',
  area: 'Районы',
  city: 'Города',
  settlement: 'Населённые пункты',
  street: 'Улицы',
  house: 'Дома',
  card: 'Дома', // на уровне домов кондуктор возвращает next_level = "card" (карточка дома)
};

/** Человекочитаемые имена полей ответа кондуктора (для карточки дома). */
export const FIELD_LABELS = {
  address: 'Адрес',
  company: 'Управляющая компания',
  company_id: 'ID УК',
  build_years: 'Год постройки',
  floors: 'Этажность',
  entrances: 'Количество подъездов',
  elevators: 'Количество лифтов',
  full_area: 'Общая площадь объекта, м²',
  house_cnt: 'Количество МКД',
  is_our_management: 'Наша УК',
  living_area: 'Площадь жилых помещений, м²',
  nonliving_area: 'Площадь нежилых помещений, м²',
  living_cnt: 'Жилых помещений',
  nonliving_cnt: 'Нежилых помещений',
  mop_area: 'Общая площадь МОП, м²',
  exploitation_year: 'Год ввода в эксплуатацию',
  project_series: 'Серия проекта',
  project_type: 'Тип проекта',
  object_type: 'Тип объекта',
  management_start: 'Дата начала управления',
  management_basis: 'Основание для управления',
  branch: 'Филиал',
  service_type: 'Вид обслуживания',
  billing: 'Биллинг',
  fias: 'Код ФИАС',
  cadastral_number: 'Кадастровый номер',
  cadastral: 'Кадастровый номер',
  fias_id: 'Код ФИАС',
  oktmo: 'ОКТМО',
  region: 'Регион',
  city: 'Город',
  street: 'Улица',
  house: 'Дом',
  building: 'Корпус',
  liter: 'Литера',
  latitude: 'Широта',
  longitude: 'Долгота',
  energy_class: 'Класс энергоэффективности',
  wall_material: 'Материал стен',
  roof_type: 'Тип крыши',
  foundation_type: 'Тип фундамента',
  status: 'Статус',
};

/** Служебные поля, которые не выводим в карточке. */
export const HIDDEN_FIELDS = new Set(['mark', 'next_level', 'next_text', 'next_value', 'buildId', 'build_id', 'id']);
