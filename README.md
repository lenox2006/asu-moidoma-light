# АСУ «Мои Дома» Light

Облегчённый сервис просмотра данных по многоквартирным домам (МКД), обслуживаемым управляющими компаниями.
Данные берутся из внешнего сервиса «Кондуктор» (методы `getHouseList` — списки, `getHouseById` — карточка дома) и **не кэшируются**.

Стек: **PHP 8.4 / Laravel 12 / PostgreSQL 16** (backend), **React 18 + MUI v5 + Vite + React Router** (frontend, тема и компоненты перенесены из основной АСУ «Мои Дома»), Docker.

Мануал по развёртыванию: [docs/DEPLOY.md](docs/DEPLOY.md).

## Функционал

- Собственная авторизация (логин/пароль, Bearer-токены Sanctum).
- Роли:
  - `superadmin` — видит все регионы, управляет пользователями (создание, редактирование, отключение, удаление);
  - `user` — привязан к **нескольким регионам и нескольким УК**: видит перечисленные регионы; внутри региона — только перечисленные УК этого региона, а если для региона УК не выбраны — все его УК.
- Экраны:
  1. Регионы (главный экран для superadmin);
  2. УК региона — с вкладками «Обслуживаемые / Ушедшие / Сторонние / Все» (по префиксу `[Сторонняя]`/`[Ушедшая]` в наименовании УК из кондуктора);
  3. Улицы УК;
  4. Дома улицы;
  5. Карточка дома — вкладка «Общие сведения».
- Поиск по текущему списку, постраничный вывод, сводные итоги, выгрузка списка в CSV, хлебные крошки-чипы.
- Если у пользователя ровно один регион — он начинает с экрана УК этого региона; если в нём ровно одна УК — с экрана улиц. Иначе — со списка регионов, отфильтрованного по его привязке.

## Архитектура

```
browser ──HTTP──▶ nginx ──▶ php-fpm (Laravel)
                               │  ├─ /api/auth/*   авторизация (Sanctum)
                               │  ├─ /api/houses   прокси getHouseList + проверка mark по области видимости
                               │  ├─ /api/users    CRUD пользователей (superadmin)
                               │  └─ /app/*        index.html SPA (React)
                               ├──▶ PostgreSQL (users, personal_access_tokens, cache, sessions)
                               └──▶ https://api.regenergy.ru/api2/asu/  (getHouseList, без кэша)
```

### Параметр `mark`

`mark` — base64 от JSON `[["region",[uuid]],["uk",[id]],["area",[]],["city",[]],["settlement",[]],["street",[]],["house",[]]]`.
Пустой `mark` = список регионов. Каждая запись ответа содержит `mark`, `next_level`, `next_text`, `next_value` следующего уровня —
фронтенд просто передаёт `mark` выбранной строки обратно. Навигация **универсальна**: если кондуктор между УК и улицами вернёт
промежуточный уровень (район/город/населённый пункт), экраны отработают без изменений кода; карточка дома открывается, когда
`next_level == "house"`; идентификатор дома для `getHouseById` берётся из строки списка домов (`build_id` / `buildId` / `next_value`).

Backend разбирает `mark` только чтобы проверить, что регион/УК в нём соответствуют привязке пользователя (`App\Support\Mark`, `App\Services\AccessScope`).

## API

| Метод | Путь | Описание |
|------|------|----------|
| POST | `/api/auth/login` `{login,password}` | → `{token, user, start:{mark, crumbs}}` |
| GET  | `/api/auth/me` | текущий пользователь и стартовая точка |
| POST | `/api/auth/logout` | отзыв токена |
| GET  | `/api/houses?mark=` | список следующего уровня (`{level, count, items[], fetched_at}`) |
| GET  | `/api/houses/card?build_id=&mark=` | карточка дома — метод кондуктора `getHouseById` (`{build_id, house, fetched_at}`); `mark` дома нужен для проверки прав |
| GET/POST/PUT/DELETE | `/api/users[/{id}]` | пользователи (только superadmin) |

Все защищённые запросы — с заголовком `Authorization: Bearer <token>`.

## Разработка локально (без Docker)

```bash
# backend
cd backend && cp .env.example .env            # указать локальный Postgres
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve                              # http://localhost:8000

# frontend (dev-сервер с прокси /api → :8000)
cd frontend && npm install && npm run dev      # http://localhost:5173/app/
```

Сборка фронтенда в `backend/public/app`: `cd frontend && npm run build`.

## Структура

```
backend/
  app/Http/Controllers/{Auth,House,User}Controller.php
  app/Http/Middleware/{EnsureSuperadmin,EnsureUserIsActive}.php
  app/Services/{ConductorClient,AccessScope}.php
  app/Support/Mark.php
  app/Console/Commands/SuperadminCommand.php
  database/migrations, database/seeders/SuperadminSeeder.php
  routes/api.php, routes/web.php
  config/conductor.php
frontend/
  src/theme/theme.js          — тема MUI (theme-v5.js основной системы), fonts.css — ProximaNova
  src/ui/                     — CardWrapper, HeadingBlock, Table, MenuTooltip, CardAsu, FormInputContainer… (перенос из АСУ МД)
  src/icons/                  — Logo, House, UsersAsu, GeneralInformation, Menu…
  src/components/{Layout,Header,MainMenu}.jsx
  src/pages/{LoginPage,HousesPage,HouseCardPage,UsersPage,UserEditPage}.jsx
  src/lib/{auth.jsx,crumbs.js,csv.js,format.js}
  src/api/client.js
  public/fonts/               — файлы шрифтов ProximaNova
docker/        nginx.conf, php-fpm.conf, supervisord.conf, entrypoint.sh
Dockerfile, docker-compose.yml, .env.example
docs/DEPLOY.md
```
