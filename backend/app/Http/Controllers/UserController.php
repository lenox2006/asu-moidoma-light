<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Управление пользователями. Доступно только superadmin (middleware `superadmin`).
 */
class UserController extends Controller
{
    /** GET /api/users */
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(
            User::query()->orderBy('role')->orderBy('login')->get()
        );
    }

    /** POST /api/users */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $user = User::create($data);

        return response()->json(new UserResource($user), 201);
    }

    /** GET /api/users/{user} */
    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    /** PUT /api/users/{user} */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $this->validatePayload($request, $user);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        // Нельзя снять роль superadmin с самого себя / отключить себя.
        if ($user->id === $request->user()->id) {
            if (($data['role'] ?? $user->role) !== User::ROLE_SUPERADMIN) {
                throw ValidationException::withMessages(['role' => ['Нельзя снять роль superadmin с самого себя']]);
            }
            if (array_key_exists('is_active', $data) && ! $data['is_active']) {
                throw ValidationException::withMessages(['is_active' => ['Нельзя отключить самого себя']]);
            }
        }

        $user->fill($data)->save();

        return response()->json(new UserResource($user->refresh()));
    }

    /** DELETE /api/users/{user} */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['id' => ['Нельзя удалить самого себя']]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?User $existing = null): array
    {
        $data = $request->validate([
            'login' => [
                'required', 'string', 'min:2', 'max:100', 'regex:/^[A-Za-z0-9._@\\-]+$/u',
                Rule::unique('users', 'login')->ignore($existing?->id),
            ],
            'name' => ['required', 'string', 'max:200'],
            'password' => [$existing ? 'nullable' : 'required', 'string', 'min:6', 'max:200'],
            'role' => ['required', Rule::in([User::ROLE_SUPERADMIN, User::ROLE_USER])],
            'regions' => ['sometimes', 'array', 'max:100'],
            'regions.*.id' => ['required', 'string', 'max:64'],
            'regions.*.name' => ['nullable', 'string', 'max:300'],
            'uks' => ['sometimes', 'array', 'max:1000'],
            'uks.*.id' => ['required', 'integer'],
            'uks.*.name' => ['nullable', 'string', 'max:300'],
            'uks.*.region_id' => ['required', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
        ], [], [
            'login' => 'логин',
            'name' => 'имя',
            'password' => 'пароль',
            'role' => 'роль',
            'regions' => 'регионы',
            'uks' => 'УК',
        ]);

        if ($data['role'] === User::ROLE_SUPERADMIN) {
            // superadmin видит всё — привязка не нужна.
            $data['regions'] = [];
            $data['uks'] = [];

            return $data;
        }

        $regions = [];
        foreach ($data['regions'] ?? [] as $r) {
            $regions[(string) $r['id']] = ['id' => (string) $r['id'], 'name' => (string) ($r['name'] ?? '')];
        }
        if ($regions === []) {
            throw ValidationException::withMessages(['regions' => ['Для обычного пользователя необходимо указать хотя бы один регион']]);
        }

        $uks = [];
        foreach ($data['uks'] ?? [] as $uk) {
            $regionId = (string) $uk['region_id'];
            if (! isset($regions[$regionId])) {
                throw ValidationException::withMessages(['uks' => ['УК «'.($uk['name'] ?? $uk['id']).'» относится к региону, который не выбран']]);
            }
            $uks[$regionId.':'.(int) $uk['id']] = [
                'id' => (int) $uk['id'],
                'name' => (string) ($uk['name'] ?? ''),
                'region_id' => $regionId,
            ];
        }

        $data['regions'] = array_values($regions);
        $data['uks'] = array_values($uks);

        return $data;
    }
}
