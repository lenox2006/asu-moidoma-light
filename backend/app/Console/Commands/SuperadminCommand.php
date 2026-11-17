<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Служебная команда для superadmin:
 *   php artisan app:superadmin                      — создать из env, если нет
 *   php artisan app:superadmin --reset-password     — сбросить пароль на SUPERADMIN_PASSWORD
 *   php artisan app:superadmin --login=x --password=y — создать/сбросить явно
 */
class SuperadminCommand extends Command
{
    protected $signature = 'app:superadmin
                            {--login= : Логин superadmin (по умолчанию SUPERADMIN_LOGIN)}
                            {--password= : Пароль (по умолчанию SUPERADMIN_PASSWORD)}
                            {--reset-password : Сбросить пароль существующего пользователя}';

    protected $description = 'Создать superadmin или сбросить его пароль';

    public function handle(): int
    {
        $login = trim((string) ($this->option('login') ?: env('SUPERADMIN_LOGIN', 'superadmin')));
        $password = (string) ($this->option('password') ?: env('SUPERADMIN_PASSWORD', ''));

        if ($login === '' || $password === '') {
            $this->error('Не заданы логин/пароль (опции --login/--password или env SUPERADMIN_LOGIN/SUPERADMIN_PASSWORD).');

            return self::FAILURE;
        }

        $user = User::query()->whereRaw('lower(login) = ?', [mb_strtolower($login)])->first();

        if ($user) {
            if (! $this->option('reset-password')) {
                $this->info("Пользователь '{$login}' уже существует. Для сброса пароля добавьте --reset-password.");

                return self::SUCCESS;
            }

            $user->password = $password;
            $user->role = User::ROLE_SUPERADMIN;
            $user->is_active = true;
            $user->save();
            $user->tokens()->delete();

            $this->info("Пароль superadmin '{$login}' сброшен, активные сессии завершены.");

            return self::SUCCESS;
        }

        User::create([
            'login' => $login,
            'name' => env('SUPERADMIN_NAME', 'Суперадминистратор'),
            'password' => $password,
            'role' => User::ROLE_SUPERADMIN,
            'is_active' => true,
        ]);

        $this->info("superadmin '{$login}' создан.");

        return self::SUCCESS;
    }
}
