<?php

/*
 * Настройки внешнего сервиса «Кондуктор» (api.regenergy.ru).
 * Данные метода getHouseList НЕ кэшируются на стороне Light — каждый
 * запрос пользователя транслируется во внешний сервис.
 */
return [
    'url' => env('CONDUCTOR_URL', 'https://api.regenergy.ru/api2/asu/'),

    // Таймаут ожидания ответа внешнего сервиса, сек.
    'timeout' => (int) env('CONDUCTOR_TIMEOUT', 60),

    // Таймаут установления соединения, сек.
    'connect_timeout' => (int) env('CONDUCTOR_CONNECT_TIMEOUT', 10),

    // Проверять TLS-сертификат внешнего сервиса.
    'verify_ssl' => filter_var(env('CONDUCTOR_VERIFY_SSL', true), FILTER_VALIDATE_BOOL),

    // Необязательные заголовки авторизации к кондуктору (если потребуются).
    'auth_header' => env('CONDUCTOR_AUTH_HEADER'),   // напр. "Authorization"
    'auth_value' => env('CONDUCTOR_AUTH_VALUE'),     // напр. "Bearer xxxxx"
];
