<?php

namespace Adtention\DatepickerFilter;

use Illuminate\Support\ServiceProvider;
use Laravel\Nova\Nova;

class FilterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Nova::serving(function (): void {
            Nova::mix('datepicker-filter', __DIR__.'/../dist/mix-manifest.json');
        });
    }
}
