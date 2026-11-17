<?php

namespace App\Services;

use App\Models\User;
use App\Support\Mark;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Область видимости пользователя: какие mark ему разрешено запрашивать,
 * с какого уровня он начинает навигацию и какие строки списка ему показывать.
 */
class AccessScope
{
    /**
     * Стартовая точка навигации пользователя.
     *
     * superadmin и пользователь с несколькими регионами начинают со списка регионов
     * (для пользователя список фильтруется). Если регион ровно один — сразу список
     * УК региона; если в нём ровно одна разрешённая УК — сразу список улиц.
     *
     * @return array{mark: string, crumbs: array<int, array{text: string, mark: string, level: string}>}
     */
    public function start(User $user): array
    {
        if ($user->isSuperadmin()) {
            return ['mark' => '', 'crumbs' => []];
        }

        $regions = is_array($user->regions) ? $user->regions : [];
        if (count($regions) !== 1) {
            return ['mark' => '', 'crumbs' => []];
        }

        $regionId = (string) $regions[0]['id'];
        $regionMark = Mark::forRegion($regionId)->encode();
        $crumbs = [[
            'level' => 'region',
            'text' => (string) ($regions[0]['name'] ?: 'Регион'),
            'mark' => $regionMark,
        ]];

        $uks = array_values(array_filter(
            is_array($user->uks) ? $user->uks : [],
            static fn ($uk) => (string) ($uk['region_id'] ?? '') === $regionId,
        ));
        if (count($uks) !== 1) {
            return ['mark' => $regionMark, 'crumbs' => $crumbs];
        }

        $ukMark = Mark::forUk($regionId, (int) $uks[0]['id'])->encode();
        $crumbs[] = [
            'level' => 'uk',
            'text' => (string) ($uks[0]['name'] ?: 'УК'),
            'mark' => $ukMark,
        ];

        return ['mark' => $ukMark, 'crumbs' => $crumbs];
    }

    /**
     * Проверить, что пользователь имеет право запросить данный mark.
     *
     * @throws AccessDeniedHttpException
     */
    public function assertAllowed(User $user, Mark $mark): void
    {
        if ($user->isSuperadmin()) {
            return;
        }

        $regionIds = $user->regionIds();
        if ($regionIds === []) {
            throw new AccessDeniedHttpException('Пользователю не назначен ни один регион');
        }

        $regionId = $mark->regionId();
        if ($regionId === null) {
            // Верхний уровень (список регионов) — разрешён, список будет отфильтрован.
            return;
        }

        if (! in_array($regionId, $regionIds, true)) {
            throw new AccessDeniedHttpException('Доступ к данному региону запрещён');
        }

        $allowedUks = $user->ukIdsForRegion($regionId);
        if ($allowedUks !== [] && $mark->ukId() !== null && ! in_array($mark->ukId(), $allowedUks, true)) {
            throw new AccessDeniedHttpException('Доступ к данной управляющей компании запрещён');
        }
    }

    /**
     * Отфильтровать строки ответа кондуктора по области видимости.
     *
     * На уровне регионов оставляем только разрешённые регионы, на уровне УК —
     * только разрешённые УК региона (если ограничение задано). На остальных
     * уровнях (улицы, дома) УК уже зафиксирована в mark и проверена в assertAllowed.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    public function filterItems(User $user, Mark $mark, array $items): array
    {
        if ($user->isSuperadmin()) {
            return $items;
        }

        $regionId = $mark->regionId();

        if ($regionId === null) {
            $allowed = $user->regionIds();

            return array_values(array_filter($items, static function (array $row) use ($allowed) {
                return in_array((string) ($row['next_value'] ?? ''), $allowed, true);
            }));
        }

        if ($mark->ukId() === null) {
            $allowedUks = $user->ukIdsForRegion($regionId);
            if ($allowedUks === []) {
                return $items;
            }

            return array_values(array_filter($items, static function (array $row) use ($allowedUks) {
                $id = $row['company_id'] ?? $row['next_value'] ?? null;

                return $id !== null && in_array((int) $id, $allowedUks, true);
            }));
        }

        return $items;
    }
}
