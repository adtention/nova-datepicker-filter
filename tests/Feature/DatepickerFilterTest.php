<?php

namespace Adtention\DatepickerFilter\Tests\Feature;

use Adtention\DatepickerFilter\DatepickerFilter;
use Adtention\DatepickerFilter\Tests\TestCase;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Laravel\Nova\Http\Requests\NovaRequest;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;

class DatepickerFilterTest extends TestCase
{
    #[Test]
    public function it_keeps_using_the_custom_datepicker_filter_component(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make();

        // Act
        $serialized = $filter->jsonSerialize();

        // Assert
        $this->assertSame('datepicker-filter', $serialized['component']);
    }

    #[Test]
    public function it_defaults_to_single_mode_with_reasonable_defaults(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make();

        // Act
        $serialized = $filter->jsonSerialize();

        // Assert
        $this->assertSame(DatepickerFilter::MODE_SINGLE, $serialized['mode']);
        $this->assertNull($serialized['currentValue']);
        $this->assertSame(config('app.locale'), $serialized['locale']);
    }

    #[Test]
    public function it_supports_single_mode_with_scalar_value_contract(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make()->single();

        // Act
        $serialized = $filter->jsonSerialize();

        // Assert
        $this->assertSame(DatepickerFilter::MODE_SINGLE, $serialized['mode']);
        $this->assertNull($serialized['currentValue']);
    }

    #[Test]
    public function it_supports_range_mode_with_tuple_value_contract(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make()->range();

        // Act
        $serialized = $filter->jsonSerialize();

        // Assert
        $this->assertSame(DatepickerFilter::MODE_RANGE, $serialized['mode']);
        $this->assertSame([null, null], $serialized['currentValue']);
    }

    #[Test]
    public function it_serializes_locale_and_placeholders_from_fluent_metadata_methods(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make()
            ->single()
            ->locale('de')
            ->placeholder('Choose a date')
            ->rangePlaceholders('From date', 'To date');

        // Act
        $serialized = $filter->jsonSerialize();

        // Assert
        $this->assertSame('de', $serialized['locale']);
        $this->assertSame('Choose a date', $serialized['placeholder']);
        $this->assertSame('From date', $serialized['startPlaceholder']);
        $this->assertSame('To date', $serialized['endPlaceholder']);
    }

    #[Test]
    public function it_throws_for_unsupported_modes(): void
    {
        // Arrange
        $filter = TestDatepickerFilter::make();

        // Assert
        $this->expectException(RuntimeException::class);

        // Act
        $filter->mode('week');
    }
}

class TestDatepickerFilter extends DatepickerFilter
{
    public function apply(NovaRequest $request, Builder $query, mixed $value): Builder
    {
        return $query;
    }

    public function options(NovaRequest $request): array
    {
        return [];
    }
}
