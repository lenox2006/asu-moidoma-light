<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Пользователь привязывается к НЕСКОЛЬКИМ регионам и НЕСКОЛЬКИМ УК.
 *
 *   regions: [{"id": "<uuid региона>", "name": "Волгоградская область"}, ...]
 *   uks:     [{"id": 60, "name": "ООО \"ВЕГА-С\"", "region_id": "<uuid региона>"}, ...]
 *
 * Семантика: пользователь видит перечисленные регионы; внутри региона — если для
 * него перечислены УК этого региона, то только их, иначе все УК региона.
 *
 * Существующие привязки (region_id / uk_id) переносятся в новые поля.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->jsonb('regions')->default('[]');
            $table->jsonb('uks')->default('[]');
        });

        // Перенос старых одиночных привязок
        foreach (DB::table('users')->whereNotNull('region_id')->get() as $u) {
            $regions = [['id' => (string) $u->region_id, 'name' => (string) ($u->region_name ?? '')]];
            $uks = [];
            if ($u->uk_id !== null) {
                $uks[] = ['id' => (int) $u->uk_id, 'name' => (string) ($u->uk_name ?? ''), 'region_id' => (string) $u->region_id];
            }
            DB::table('users')->where('id', $u->id)->update([
                'regions' => json_encode($regions, JSON_UNESCAPED_UNICODE),
                'uks' => json_encode($uks, JSON_UNESCAPED_UNICODE),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['region_id']);
            $table->dropIndex(['uk_id']);
            $table->dropColumn(['region_id', 'region_name', 'uk_id', 'uk_name']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('region_id', 64)->nullable()->index();
            $table->string('region_name', 300)->nullable();
            $table->integer('uk_id')->nullable()->index();
            $table->string('uk_name', 300)->nullable();
        });

        foreach (DB::table('users')->get() as $u) {
            $regions = json_decode($u->regions ?? '[]', true) ?: [];
            $uks = json_decode($u->uks ?? '[]', true) ?: [];
            DB::table('users')->where('id', $u->id)->update([
                'region_id' => $regions[0]['id'] ?? null,
                'region_name' => $regions[0]['name'] ?? null,
                'uk_id' => $uks[0]['id'] ?? null,
                'uk_name' => $uks[0]['name'] ?? null,
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['regions', 'uks']);
        });
    }
};
