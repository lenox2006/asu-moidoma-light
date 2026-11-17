<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Создаёт superadmin из переменных окружения SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD,
 * если пользователя с таким логином ещё нет. Идемпотентен — безопасно запускать
 * при каждом старте контейнера. Пароль существующего пользователя НЕ меняется
 * (для сброса пароля: `php artisan app:superadmin --reset-password`).
 */
class SuperadminSeeder extends Seeder
{
    public function run(): void
    {
        $login = trim((string) env('SUPERADMIN_LOGIN', 'superadmin'));
        $password = (string) env('SUPERADMIN_PASSWORD', '');

        if ($login === '' || $password === '') {
            $this->command?->warn('SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD не заданы — superadmin не создан.');

            return;
        }

        $existing = User::query()->whereRaw('lower(login) = ?', [mb_strtolower($login)])->first();
        if ($existing) {
            $this->command?->info("superadmin '{$login}' уже существует — пропуск.");

            return;
        }

        User::create([
            'login' => $login,
            'name' => env('SUPERADMIN_NAME', 'Суперадминистратор'),
            'password' => $password,
            'role' => User::ROLE_SUPERADMIN,
            'is_active' => true,
        ]);

        $this->command?->info("superadmin '{$login}' создан.");
    }
}
