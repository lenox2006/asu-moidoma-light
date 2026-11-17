<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Клиент внешнего сервиса «Кондуктор» (api.regenergy.ru/api2/asu/).
 *
 * Формат запроса:
 *   POST { "action": "getHouseList", "params": { "mark": "<base64|''>" } }
 * Формат ответа:
 *   { "result": [ {...}, ... ], "error": { "code": 200, "msg": "" } }
 *
 * Кэширование НЕ выполняется (требование ТЗ).
 */
class ConductorClient
{
    /**
     * Получить список объектов следующего уровня по mark.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws ConductorException
     */
    public function getHouseList(string $mark): array
    {
        $payload = $this->call('getHouseList', ['mark' => $mark]);

        $result = $payload['result'] ?? null;
        if (! is_array($result)) {
            throw new ConductorException('Кондуктор вернул ответ без поля result');
        }

        return array_values($result);
    }

    /**
     * Карточка дома по идентификатору (buildId берётся из getHouseList на уровне домов).
     *
     * Кондуктор может вернуть объект или массив из одного элемента — нормализуем к объекту.
     *
     * @return array<string, mixed>
     *
     * @throws ConductorException
     */
    public function getHouseById(string $buildId): array
    {
        $payload = $this->call('getHouseById', ['buildId' => $buildId]);

        $result = $payload['result'] ?? null;
        if (is_array($result) && array_is_list($result)) {
            $result = $result[0] ?? null;
        }
        if (! is_array($result)) {
            throw new ConductorException('Кондуктор не вернул данные по дому '.$buildId);
        }

        return $result;
    }

    /**
     * Универсальный вызов метода кондуктора.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     *
     * @throws ConductorException
     */
    public function call(string $action, array $params): array
    {
        try {
            $response = $this->http()->post(config('conductor.url'), [
                'action' => $action,
                'params' => $params,
            ]);
        } catch (ConnectionException $e) {
            Log::warning('Conductor connection error', ['action' => $action, 'error' => $e->getMessage()]);
            throw new ConductorException('Внешний сервис недоступен: '.$e->getMessage(), 0, $e);
        }

        if (! $response->successful()) {
            Log::warning('Conductor HTTP error', [
                'action' => $action,
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);
            throw new ConductorException('Внешний сервис вернул HTTP '.$response->status());
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new ConductorException('Внешний сервис вернул не-JSON ответ');
        }

        $code = (int) ($payload['error']['code'] ?? 200);
        if ($code !== 200) {
            $msg = (string) ($payload['error']['msg'] ?? '');
            throw new ConductorException(sprintf('Ошибка внешнего сервиса (%d): %s', $code, $msg ?: 'без описания'));
        }

        return $payload;
    }

    private function http(): PendingRequest
    {
        $request = Http::acceptJson()
            ->asJson()
            ->timeout((int) config('conductor.timeout', 60))
            ->connectTimeout((int) config('conductor.connect_timeout', 10))
            ->withOptions(['verify' => (bool) config('conductor.verify_ssl', true)]);

        $header = config('conductor.auth_header');
        $value = config('conductor.auth_value');
        if ($header && $value) {
            $request = $request->withHeaders([$header => $value]);
        }

        return $request;
    }
}
