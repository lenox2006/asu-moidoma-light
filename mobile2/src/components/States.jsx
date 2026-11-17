import { Alert, Empty } from './Icons';

export function Loading({ rows = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton" key={i} aria-hidden="true"><span style={{ width: `${55 + (i % 3) * 12}%` }} /><span style={{ width: '85%' }} /></div>
      ))}
      <div className="state" style={{ border: 0, background: 'transparent', padding: 8 }} role="status">Загрузка данных</div>
    </>
  );
}

export function EmptyState({ title = 'Ничего не найдено', text = 'Измените запрос или сбросьте фильтр', action = null }) {
  return (
    <div className="state">
      <Empty />
      <div className="state-title">{title}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
      {action}
    </div>
  );
}

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="error-card" role="alert">
      <Alert />
      <div>
        <div className="error-title">Внешний сервис недоступен</div>
        <div className="error-text">{message || 'Не удалось получить данные из кондуктора. Проверьте соединение и повторите попытку.'}</div>
        {onRetry ? <button type="button" className="btn small sm-danger" style={{ marginTop: 10 }} onClick={onRetry}>Повторить</button> : null}
      </div>
    </div>
  );
}
