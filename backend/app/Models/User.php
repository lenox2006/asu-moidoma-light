<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Пользователь сервиса «АСУ Мои Дома Light».
 *
 * Область видимости:
 *  - role = superadmin — видит все регионы, управляет пользователями;
 *  - role = user       — видит регионы из `regions`; внутри региона — УК из `uks`
 *                        этого региона, а если для региона УК не перечислены — все УК региона.
 *
 * @property int    $id
 * @property string $login
 * @property string $name
 * @property string $role
 * @property array  $regions  [{id: string, name: string}]
 * @property array  $uks      [{id: int, name: string, region_id: string}]
 * @property bool   $is_active
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_SUPERADMIN = 'superadmin';
    public const ROLE_USER = 'user';

    protected $fillable = [
        'login',
        'name',
        'password',
        'role',
        'regions',
        'uks',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $attributes = [
        'regions' => '[]',
        'uks' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'regions' => 'array',
            'uks' => 'array',
        ];
    }

    public function isSuperadmin(): bool
    {
        return $this->role === self::ROLE_SUPERADMIN;
    }

    /** @return string[] идентификаторы разрешённых регионов */
    public function regionIds(): array
    {
        return array_values(array_unique(array_map(
            static fn ($r) => (string) ($r['id'] ?? ''),
            is_array($this->regions) ? $this->regions : [],
        )));
    }

    /**
     * Идентификаторы разрешённых УК региона. Пустой массив — ограничения по УК нет.
     *
     * @return int[]
     */
    public function ukIdsForRegion(string $regionId): array
    {
        $ids = [];
        foreach (is_array($this->uks) ? $this->uks : [] as $uk) {
            if ((string) ($uk['region_id'] ?? '') === $regionId && isset($uk['id'])) {
                $ids[] = (int) $uk['id'];
            }
        }

        return array_values(array_unique($ids));
    }
}
