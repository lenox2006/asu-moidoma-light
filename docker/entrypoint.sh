#!/bin/sh
# Инициализация контейнера приложения:
#  1) ждём БД; 2) генерируем APP_KEY, если не задан; 3) миграции; 4) superadmin;
#  5) кэшируем конфиг/маршруты; 6) запускаем supervisord (nginx + php-fpm).
set -e
cd /var/www/html

echo "[entrypoint] ожидание PostgreSQL ${DB_HOST:-db}:${DB_PORT:-5432} ..."
i=0
until php -r 'try { new PDO("pgsql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0);} catch (Throwable $e) { exit(1); }' 2>/dev/null; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then echo "[entrypoint] БД недоступна, выход"; exit 1; fi
  sleep 2
done
echo "[entrypoint] БД доступна"

if [ -z "$APP_KEY" ]; then
  # Ключ хранится в volume, чтобы не меняться при перезапуске контейнера
  KEY_FILE=storage/app/.app_key
  if [ ! -s "$KEY_FILE" ]; then
    php -r 'echo "base64:".base64_encode(random_bytes(32));' > "$KEY_FILE"
    echo "[entrypoint] сгенерирован новый APP_KEY (storage/app/.app_key)"
  fi
  export APP_KEY="$(cat "$KEY_FILE")"
fi

php artisan migrate --force --no-interaction
php artisan db:seed --class=SuperadminSeeder --force --no-interaction

php artisan config:cache
php artisan route:cache

chown -R www-data:www-data storage bootstrap/cache

echo "[entrypoint] запуск nginx + php-fpm"
exec "$@"
