/**
 * Хлебные крошки навигации Регион → УК → Улица → Дом.
 *
 * mark сам по себе не содержит названий уровней (только идентификаторы),
 * поэтому цепочку «название → mark» храним в localStorage по ключу mark.
 * Это позволяет перезагружать страницу и открывать карточку дома в новой вкладке.
 */
const KEY = 'asu_light_crumbs';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* переполнение хранилища — не критично */
  }
}

/** Запомнить цепочку крошек для mark. */
export function rememberCrumbs(mark, crumbs) {
  const map = load();
  map[mark || ''] = crumbs;
  save(map);
}

/** Получить цепочку крошек для mark (fallback — стартовые крошки пользователя). */
export function getCrumbs(mark, fallback = []) {
  const map = load();
  return map[mark || ''] || fallback;
}

export function clearCrumbs() {
  localStorage.removeItem(KEY);
}
