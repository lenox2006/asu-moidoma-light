<?php

namespace App\Http\Controllers;

use App\Services\AccessScope;
use App\Services\ConductorClient;
use App\Support\Mark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

/**
 * Прокси к методу getHouseList кондуктора с проверкой области видимости.
 *
 * GET /api/houses?mark=<mark>
 *   mark пустой  — список регионов (только superadmin);
 *   mark региона — список УК региона;
 *   mark УК      — список улиц; и т.д. по next_level из ответа.
 *
 * Ответ отдаётся как есть (без кэширования), плюс служебные поля.
 */
class HouseController extends Controller
{
    public function __construct(
        private readonly ConductorClient $conductor,
        private readonly AccessScope $scope,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $markStr = (string) $request->query('mark', '');

        try {
            $mark = Mark::parse($markStr);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['mark' => [$e->getMessage()]]);
        }

        $this->scope->assertAllowed($request->user(), $mark);

        $items = $this->scope->filterItems(
            $request->user(),
            $mark,
            $this->conductor->getHouseList($markStr),
        );

        $levels = array_values(array_unique(array_map(
            static fn (array $r) => (string) ($r['next_level'] ?? ''),
            $items,
        )));

        return response()->json([
            'mark' => $markStr,
            'level' => $levels[0] ?? null,   // уровень элементов списка (region/uk/street/house...)
            'count' => count($items),
            'items' => $items,
            'fetched_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/houses/card?build_id=<buildId>&mark=<mark дома>
     *
     * Карточка дома: данные метода getHouseById кондуктора. buildId берётся из
     * getHouseList на уровне домов; mark дома передаётся для проверки области
     * видимости пользователя (регион/УК).
     */
    public function card(Request $request): JsonResponse
    {
        $data = $request->validate([
            'build_id' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9_\\-]+$/'],
            'mark' => ['nullable', 'string'],
        ]);

        $markStr = (string) ($data['mark'] ?? '');

        try {
            $mark = Mark::parse($markStr);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['mark' => [$e->getMessage()]]);
        }

        $user = $request->user();
        if (! $user->isSuperadmin() && $mark->isEmpty()) {
            throw ValidationException::withMessages(['mark' => ['Не указан mark дома']]);
        }

        $this->scope->assertAllowed($user, $mark);

        $house = $this->conductor->getHouseById($data['build_id']);

        return response()->json([
            'build_id' => $data['build_id'],
            'mark' => $markStr,
            'house' => $house,
            'fetched_at' => now()->toIso8601String(),
        ]);
    }
}
