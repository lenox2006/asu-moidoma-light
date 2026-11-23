<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AccessScope;
use App\Services\ConductorClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Аналитика «Движение жилого фонда».
 *
 * GET /api/analytics/housing-movement?period=month&step=week&group_by=region
 *
 * Прокси к методу analyticsHousingMoving кондуктора. Ответ отдаётся без кэширования,
 * но ограничивается областью видимости пользователя: регионы — по users.regions,
 * управляющие компании внутри региона — по users.uks. Итоги (summary) пересчитываются
 * по видимым регионам, иначе пользователь увидел бы цифры по всему холдингу.
 */
class AnalyticsController extends Controller
{
    private const PRESETS = ['month', 'half_year', 'ytd', 'year', 'custom'];

    private const STEPS = ['week', 'month', 'quarter'];

    public function __construct(
        private readonly ConductorClient $conductor,
        private readonly AccessScope $scope,
    ) {
    }

    public function housingMovement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => ['nullable', 'string', 'in:'.implode(',', self::PRESETS)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'step' => ['nullable', 'string', 'in:'.implode(',', self::STEPS)],
            'region_id' => ['nullable', 'string', 'max:64'],
            'uk_id' => ['nullable', 'integer'],
            'group_by' => ['nullable', 'string', 'in:region,uk'],
            'include' => ['nullable', 'string', 'max:64'],
        ]);

        $period = $data['period'] ?? 'month';
        if ($period === 'custom' && (empty($data['from']) || empty($data['to']))) {
            throw ValidationException::withMessages([
                'from' => ['Для произвольного периода нужны даты «с» и «по»'],
            ]);
        }
        if (! empty($data['from']) && ! empty($data['to']) && $data['from'] > $data['to']) {
            throw ValidationException::withMessages(['from' => ['Дата «с» позже даты «по»']]);
        }

        /** @var User $user */
        $user = $request->user();
        $regionId = (string) ($data['region_id'] ?? '');

        if (! $user->isSuperadmin()) {
            $allowed = $user->regionIds();
            if ($regionId !== '' && ! in_array($regionId, $allowed, true)) {
                abort(403, 'Регион недоступен');
            }
            // один доступный регион — сужаем запрос сразу на стороне кондуктора
            if ($regionId === '' && count($allowed) === 1) {
                $regionId = $allowed[0];
            }
        }

        $result = $this->conductor->analyticsHousingMoving([
            'period' => $period,
            'from' => (string) ($data['from'] ?? ''),
            'to' => (string) ($data['to'] ?? ''),
            'step' => (string) ($data['step'] ?? ''),
            'region_id' => $regionId,
            'uk_id' => isset($data['uk_id']) ? (string) $data['uk_id'] : '',
            'group_by' => (string) ($data['group_by'] ?? 'region'),
            'include' => (string) ($data['include'] ?? 'series'),
        ]);

        $result['groups'] = $this->limitToScope($user, $this->asList($result['groups'] ?? []));
        $result['series'] = $this->asList($result['series'] ?? []);
        $result['summary'] = $this->summarize($result['groups'], $result['summary'] ?? []);
        $result['scope'] = [
            'regions' => count($result['groups']),
            'uks' => array_sum(array_map(
                static fn (array $g) => count($g['top_uks'] ?? []),
                $result['groups'],
            )),
            'is_superadmin' => $user->isSuperadmin(),
        ];

        return response()->json($result);
    }

    /**
     * Кондуктор отдаёт коллекции то массивом, то объектом с ключами-индексами.
     * Приводим к списку, иначе в JSON уедет объект и клиент не сможет его перебрать.
     *
     * @param  mixed  $value
     * @return array<int, mixed>
     */
    private function asList(mixed $value): array
    {
        return is_array($value) ? array_values($value) : [];
    }

    /**
     * Оставляет только доступные пользователю регионы и УК.
     *
     * @param  array<int, array<string, mixed>>  $groups
     * @return array<int, array<string, mixed>>
     */
    private function limitToScope(User $user, array $groups): array
    {
        $normalize = fn (array $g) => array_merge($g, ['top_uks' => $this->asList($g['top_uks'] ?? [])]);

        if ($user->isSuperadmin()) {
            return array_values(array_map($normalize, $groups));
        }

        $allowedRegions = $user->regionIds();

        $groups = array_filter($groups, static function (array $g) use ($allowedRegions) {
            $kind = (string) ($g['kind'] ?? 'region');

            return $kind !== 'region' || in_array((string) ($g['id'] ?? ''), $allowedRegions, true);
        });

        return array_values(array_map(function (array $g) use ($user, $normalize) {
            $g = $normalize($g);
            $ukIds = $user->ukIdsForRegion((string) ($g['id'] ?? ''));
            if ($ukIds !== []) {
                $g['top_uks'] = array_values(array_filter(
                    $g['top_uks'],
                    static fn ($uk) => is_array($uk) && in_array((int) ($uk['id'] ?? 0), $ukIds, true),
                ));
            }

            return $g;
        }, $groups));
    }

    /**
     * Итоги по видимым регионам. Поля, которых нет в группах, берём из исходного summary.
     *
     * @param  array<int, array<string, mixed>>  $groups
     * @param  array<string, mixed>  $original
     * @return array<string, mixed>
     */
    private function summarize(array $groups, array $original): array
    {
        $sum = static fn (string $field) => array_sum(array_map(
            static fn (array $g) => (float) ($g[$field] ?? 0),
            $groups,
        ));

        return array_merge($original, [
            'area_total' => round($sum('area_total'), 2),
            'area_in' => round($sum('area_in'), 2),
            'area_out' => round($sum('area_out'), 2),
            'area_delta' => round($sum('area_delta'), 2),
            'houses_total' => (int) $sum('houses_total'),
            'houses_in' => (int) $sum('houses_in'),
            'houses_out' => (int) $sum('houses_out'),
            'houses_delta' => (int) $sum('houses_delta'),
        ]);
    }
}
