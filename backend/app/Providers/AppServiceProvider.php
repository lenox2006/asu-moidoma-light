<?php

namespace App\Providers;

use App\Services\AccessScope;
use App\Services\ConductorClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ConductorClient::class);
        $this->app->singleton(AccessScope::class);
    }

    public function boot(): void
    {
        //
    }
}
