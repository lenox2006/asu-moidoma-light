<?php

use Illuminate\Support\Facades\Route;

/*
 * SPA (React) собирается в public/app/ и живёт по префиксу /app.
 * Статика (/app/assets/...) отдаётся nginx напрямую; на любой другой
 * маршрут под /app отдаём index.html — дальше работает React Router.
 */
Route::get('/', fn () => redirect('/app/'));

Route::get('/app/{any?}', function () {
    $index = public_path('app/index.html');

    abort_unless(is_file($index), 404, 'Фронтенд не собран: отсутствует public/app/index.html');

    return response()->file($index, ['Cache-Control' => 'no-cache']);
})->where('any', '.*');

/*
 * Мобильная версия (React, mobile/) собирается в public/m/ и живёт по префиксу /m.
 */
Route::get('/m/{any?}', function () {
    $index = public_path('m/index.html');

    abort_unless(is_file($index), 404, 'Мобильная версия не собрана: отсутствует public/m/index.html');

    return response()->file($index, ['Cache-Control' => 'no-cache']);
})->where('any', '.*');

/*
 * Мобильная версия, вариант оформления «Мой Дом 24» (mobile2/) — public/m2/, префикс /m2.
 */
Route::get('/m2/{any?}', function () {
    $index = public_path('m2/index.html');

    abort_unless(is_file($index), 404, 'Мобильная версия (m2) не собрана: отсутствует public/m2/index.html');

    return response()->file($index, ['Cache-Control' => 'no-cache']);
})->where('any', '.*');
