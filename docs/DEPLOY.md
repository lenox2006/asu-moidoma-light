# АСУ «Мои Дома» Light — развёртывание в Docker

Целевой сервер: **82.114.226.241**, внешний порт **3333**.
Приложение после запуска доступно по адресу `http://82.114.226.241:3333/`.

## 1. Что разворачивается

Два контейнера (docker compose):

| Контейнер        | Образ                     | Назначение                                                        |
|------------------|---------------------------|-------------------------------------------------------------------|
| `asu-light-app`  | `asu-mydoma-light:latest` (собирается из `Dockerfile`) | nginx + php-fpm 8.4 (Laravel 12) + собранный React-фронтенд. Слушает порт 80 внутри, наружу публикуется как `3333`. |
| `asu-light-db`   | `postgres:16-alpine`      | Локальная БД (пользователи, токены, кэш rate-limit). Наружу не публикуется. |

Данные в volume'ах: `db_data` (PostgreSQL) и `app_storage` (`storage/` Laravel — логи, ключ приложения).

Внешний сервис «Кондуктор» (`https://api.regenergy.ru/api2/asu/`) вызывается из контейнера `app` при каждом запросе пользователя — **ничего не кэшируется**. Серверу нужен исходящий доступ в интернет по HTTPS (443) к `api.regenergy.ru`.

## 2. Требования к серверу

- Linux (Ubuntu 22.04/24.04, Debian 12 и т.п.), 1 vCPU / 1 GB RAM достаточно.
- Docker Engine ≥ 24 и плагин Docker Compose v2 (`docker compose version`).
- Открыт входящий TCP‑порт **3333** (firewall / security group).
- Исходящий HTTPS к `api.regenergy.ru`, а при сборке образа — к Docker Hub, packagist.org и registry.npmjs.org.

Установка Docker (Ubuntu), если его ещё нет:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # перелогиниться после этого
docker compose version
```

## 3. Первичное развёртывание

### 3.1. Доставка кода на сервер

Вариант A — из git:

```bash
ssh root@82.114.226.241
mkdir -p /opt/asu-light && cd /opt/asu-light
git clone <url-репозитория> .
```

Вариант B — архив:

```bash
scp asu-mydoma-light.zip root@82.114.226.241:/opt/
ssh root@82.114.226.241
cd /opt && unzip asu-mydoma-light.zip && mv asu-mydoma-light asu-light && cd asu-light
```

### 3.2. Конфигурация

```bash
cp .env.example .env
nano .env
```

Обязательно задать:

| Переменная            | Описание |
|-----------------------|----------|
| `APP_PORT`            | Внешний порт — `3333`. |
| `APP_URL`             | `http://82.114.226.241:3333` |
| `DB_PASSWORD`         | Пароль БД (любая надёжная строка; используется и контейнером БД, и приложением). |
| `SUPERADMIN_LOGIN`    | Логин первого суперадминистратора (по умолчанию `superadmin`). |
| `SUPERADMIN_PASSWORD` | Пароль суперадминистратора. Создаётся при первом старте; потом пароль меняется через интерфейс. |
| `CONDUCTOR_URL`       | URL кондуктора (по умолчанию `https://api.regenergy.ru/api2/asu/`). |

`APP_KEY` можно оставить пустым — ключ сгенерируется при первом старте и сохранится в volume `app_storage` (`storage/app/.app_key`). Если хотите задать явно: `openssl rand -base64 32` → `APP_KEY=base64:<...>`.

Если кондуктор требует авторизацию — раскомментируйте `CONDUCTOR_AUTH_HEADER` / `CONDUCTOR_AUTH_VALUE`.

### 3.3. Сборка и запуск

```bash
docker compose build          # 3–6 минут при первой сборке
docker compose up -d
docker compose logs -f app    # дождаться строки "[entrypoint] запуск nginx + php-fpm"
```

При старте контейнер `app` сам: ждёт БД → генерирует `APP_KEY` (если пуст) → выполняет миграции → создаёт `superadmin` (если его нет) → кэширует конфиг и маршруты → запускает nginx + php-fpm.

### 3.4. Проверка

```bash
curl -s http://127.0.0.1:3333/up                     # → OK (health-check Laravel)
curl -s -X POST http://127.0.0.1:3333/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"login":"superadmin","password":"<пароль из .env>"}'   # → {"token": "...", ...}
```

В браузере: `http://82.114.226.241:3333/` → форма входа → логин/пароль superadmin → список регионов.

## 4. Обновление версии

```bash
cd /opt/asu-light
git pull                        # или распаковать новый архив поверх
docker compose build
docker compose up -d            # пересоздаст только контейнер app; миграции применятся автоматически
docker compose logs --tail=50 app
```

БД и ключ приложения сохраняются в volume'ах, пользователи не теряются.

## 5. Эксплуатация

```bash
docker compose ps                       # статус
docker compose logs -f app              # логи приложения (nginx + php-fpm + Laravel → stdout/stderr)
docker compose restart app              # перезапуск приложения
docker compose down                     # остановить (данные в volume'ах сохраняются)
docker compose down -v                  # остановить И УДАЛИТЬ данные (БД, ключ) — осторожно
```

### Сброс пароля superadmin

```bash
docker compose exec app php artisan app:superadmin --reset-password            # пароль из SUPERADMIN_PASSWORD
docker compose exec app php artisan app:superadmin --login=admin2 --password=Secret123   # создать ещё одного
```

### Резервная копия БД

```bash
docker compose exec db pg_dump -U asu_light asu_light > backup_$(date +%F).sql
# восстановление:
cat backup_2026-01-01.sql | docker compose exec -T db psql -U asu_light asu_light
```

### Консоль Laravel

```bash
docker compose exec app php artisan tinker
docker compose exec app php artisan migrate:status
```

## 6. Типовые проблемы

| Симптом | Причина / решение |
|---------|-------------------|
| `docker compose up` падает: `Задайте DB_PASSWORD в .env` | Не заполнен `.env` (п. 3.2). |
| В логах `[entrypoint] БД недоступна` | Контейнер `db` не поднялся — `docker compose logs db`. Чаще всего сменили `DB_PASSWORD` после первого запуска: либо верните старый, либо `docker compose down -v` (данные потеряются). |
| В интерфейсе «Внешний сервис недоступен» / HTTP 502 от `/api/houses` | Из контейнера нет доступа к `api.regenergy.ru`. Проверить: `docker compose exec app curl -sS -m 10 -X POST https://api.regenergy.ru/api2/asu/ -H 'Content-Type: application/json' -d '{"action":"getHouseList","params":{"mark":""}}'`. Проверить прокси/firewall сервера, DNS Docker'а. |
| Долгие ответы, таймауты | Кондуктор отвечает медленно: увеличить `CONDUCTOR_TIMEOUT` в `.env` (и `fastcgi_read_timeout` в `docker/nginx.conf`, если > 120 с), пересобрать/перезапустить. |
| 404 на `/app/...` после обновления | Фронтенд не собрался в образе: `docker compose build --no-cache app`, смотреть вывод стадии `frontend`. |
| Порт 3333 занят | Изменить `APP_PORT` в `.env` и `docker compose up -d`. |
| Нужен HTTPS | Поставить перед контейнером reverse-proxy (nginx/Caddy/Traefik) с сертификатом и проксировать на `127.0.0.1:3333`; `APP_URL` поменять на https-адрес. Приложение доверяет заголовкам `X-Forwarded-*`. |

## 7. Безопасность

- Сервис имеет собственную авторизацию (Sanctum, Bearer-токены, срок жизни `SANCTUM_TOKEN_EXPIRATION` минут, по умолчанию 12 ч).
- Вход ограничен 10 попытками в минуту с одного IP.
- Пароли хранятся в bcrypt. Обычный пользователь привязан к региону и (опционально) к УК; сервер проверяет каждый `mark` на соответствие области видимости — обойти ограничение подменой параметров нельзя.
- БД PostgreSQL наружу не публикуется.
- Рекомендуется закрыть порт 3333 на уровне firewall для всех, кроме нужных сетей, либо вынести за reverse-proxy с HTTPS.
