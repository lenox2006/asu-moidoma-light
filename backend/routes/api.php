<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HouseController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
});

Route::middleware(['auth:sanctum', EnsureUserIsActive::class])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Данные по домам (прокси к кондуктору, без кэша)
    Route::get('houses', [HouseController::class, 'index']);
    Route::get('houses/card', [HouseController::class, 'card']);

    // Управление пользователями — только superadmin
    Route::middleware('superadmin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
