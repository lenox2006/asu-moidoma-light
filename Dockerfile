# syntax=docker/dockerfile:1.6
# =============================================================================
# АСУ "Мои Дома" Light — единый образ: nginx + php-fpm 8.4 + собранный React.
# Версия PHP для резолвинга зависимостей зафиксирована в composer.json (config.platform.php)
# и ДОЛЖНА совпадать с runtime-образом ниже.
# Сборка в три стадии: фронтенд (node) → зависимости PHP (composer) → runtime.
# =============================================================================

# ---------- 1. Сборка фронтенда (веб /app, мобильные версии /m и /m2) ----------
FROM node:22-alpine AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json* ./frontend/
COPY mobile/package.json mobile/package-lock.json* ./mobile/
COPY mobile2/package.json mobile2/package-lock.json* ./mobile2/
RUN cd frontend && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund) \
 && cd ../mobile && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund) \
 && cd ../mobile2 && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)
COPY frontend/ ./frontend/
COPY mobile/ ./mobile/
COPY mobile2/ ./mobile2/
# vite.config.js каждого проекта собирает в ../backend/public/{app,m}
RUN mkdir -p backend/public && cd frontend && npm run build && cd ../mobile && npm run build && cd ../mobile2 && npm run build

# ---------- 2. Зависимости PHP ----------
FROM composer:2 AS vendor
WORKDIR /src/backend
COPY backend/composer.json backend/composer.lock* ./
# Если composer.lock нет — зависимости резолвятся заново. Пакеты с security-advisory
# Composer по умолчанию блокирует; для сборки без lock-файла эту проверку отключаем
# (резолвер всё равно берёт последние версии в рамках ^12.0).
RUN composer config policy.advisories.block false \
 && composer install \
      --no-dev --no-interaction --no-progress --prefer-dist \
      --no-scripts --no-autoloader --ignore-platform-req=ext-*
COPY backend/ ./
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
 && composer run-script post-autoload-dump --no-interaction || true

# ---------- 3. Runtime ----------
FROM php:8.4-fpm-alpine AS runtime

RUN apk add --no-cache nginx supervisor curl tzdata postgresql-client \
      libpq icu-libs libzip oniguruma \
 && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
      postgresql-dev icu-dev libzip-dev oniguruma-dev \
 && docker-php-ext-configure intl \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql intl opcache bcmath \
 && apk del .build-deps

ENV TZ=Europe/Moscow

# PHP: production-настройки и opcache
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && { \
      echo 'opcache.enable=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'memory_limit=256M'; \
      echo 'upload_max_filesize=10M'; \
      echo 'post_max_size=10M'; \
      echo 'expose_php=Off'; \
      echo 'date.timezone=Europe/Moscow'; \
    } > "$PHP_INI_DIR/conf.d/zz-app.ini"

COPY docker/nginx.conf       /etc/nginx/nginx.conf
COPY docker/php-fpm.conf     /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh    /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html

# Backend + vendor + собранный фронтенд
COPY --from=vendor   /src/backend/ ./
COPY --from=frontend /src/backend/public/app ./public/app
COPY --from=frontend /src/backend/public/m   ./public/m
COPY --from=frontend /src/backend/public/m2  ./public/m2

RUN mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions \
      storage/framework/views storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R ug+rwX storage bootstrap/cache

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
