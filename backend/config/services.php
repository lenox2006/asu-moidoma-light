<?php

return [

    /*
     * Параметры Apple для файла apple-app-site-association.
     * APPLE_TEAM_ID — идентификатор команды из Apple Developer (Membership details).
     * Пока не задан, файл не отдаётся (404).
     */
    'apple' => [
        'team_id' => env('APPLE_TEAM_ID'),
        'bundle_id' => env('APPLE_APP_BUNDLE_ID', 'kz.synapse.asulight'),
    ],

];
