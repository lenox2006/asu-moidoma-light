<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Параметр `mark` метода getHouseList кондуктора.
 *
 * Это base64 от JSON-массива уровней фильтрации:
 *   [["region",["<uuid>"]],["uk",[<id>]],["area",[]],["city",[]],
 *    ["settlement",[]],["street",[]],["house",[]]]
 *
 * Пустой mark ("") — верхний уровень (список регионов).
 * Каждая запись ответа содержит mark следующего уровня, поэтому
 * фронтенд просто передаёт его обратно — здесь mark разбирается
 * только для проверки области видимости пользователя и для построения
 * стартового mark.
 */
final class Mark
{
    public const LEVELS = ['region', 'uk', 'area', 'city', 'settlement', 'street', 'house'];

    /** @var array<string, array<int, mixed>> */
    private array $levels;

    /**
     * @param  array<string, array<int, mixed>>  $levels
     */
    private function __construct(array $levels)
    {
        $this->levels = $levels;
    }

    public static function empty(): self
    {
        return new self(array_fill_keys(self::LEVELS, []));
    }

    /**
     * Разобрать строку mark. Пустая строка — верхний уровень.
     *
     * @throws InvalidArgumentException если mark повреждён
     */
    public static function parse(?string $mark): self
    {
        $mark = trim((string) $mark);
        if ($mark === '') {
            return self::empty();
        }

        $json = base64_decode($mark, true);
        if ($json === false) {
            throw new InvalidArgumentException('Некорректный параметр mark (base64)');
        }

        $data = json_decode($json, true);
        if (! is_array($data)) {
            throw new InvalidArgumentException('Некорректный параметр mark (json)');
        }

        $levels = array_fill_keys(self::LEVELS, []);
        foreach ($data as $pair) {
            if (! is_array($pair) || count($pair) < 2 || ! is_string($pair[0])) {
                throw new InvalidArgumentException('Некорректный параметр mark (структура)');
            }
            $levels[$pair[0]] = is_array($pair[1]) ? array_values($pair[1]) : [$pair[1]];
        }

        return new self($levels);
    }

    public function with(string $level, mixed $value): self
    {
        $levels = $this->levels;
        $levels[$level] = $value === null ? [] : [$value];

        return new self($levels);
    }

    /** Первое значение уровня (или null). */
    public function first(string $level): mixed
    {
        return $this->levels[$level][0] ?? null;
    }

    public function regionId(): ?string
    {
        $v = $this->first('region');

        return $v === null ? null : (string) $v;
    }

    public function ukId(): ?int
    {
        $v = $this->first('uk');

        return $v === null ? null : (int) $v;
    }

    public function isEmpty(): bool
    {
        foreach ($this->levels as $values) {
            if ($values !== []) {
                return false;
            }
        }

        return true;
    }

    /** Строка в формате кондуктора. Пустой mark кодируется как "". */
    public function encode(): string
    {
        if ($this->isEmpty()) {
            return '';
        }

        $out = [];
        foreach (self::LEVELS as $level) {
            $out[] = [$level, $this->levels[$level] ?? []];
        }

        return base64_encode(json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /** Построить стартовый mark для региона. */
    public static function forRegion(string $regionId): self
    {
        return self::empty()->with('region', $regionId);
    }

    /** Построить стартовый mark для УК внутри региона. */
    public static function forUk(string $regionId, int $ukId): self
    {
        return self::empty()->with('region', $regionId)->with('uk', $ukId);
    }

    /** @return array<string, array<int, mixed>> */
    public function toArray(): array
    {
        return $this->levels;
    }
}
