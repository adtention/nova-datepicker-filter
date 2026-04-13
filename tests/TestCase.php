<?php

namespace Adtention\DatepickerFilter\Tests;

use Adtention\DatepickerFilter\FilterServiceProvider;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

abstract class TestCase extends OrchestraTestCase
{
    protected function getPackageProviders(mixed $app): array
    {
        return [
            FilterServiceProvider::class,
        ];
    }
}
