<?php

namespace Adtention\DatepickerFilter;

use Illuminate\Support\Arr;
use Laravel\Nova\Filters\Filter;
use RuntimeException;

abstract class DatepickerFilter extends Filter
{
    public const MODE_SINGLE = 'single';

    public const MODE_RANGE = 'range';

    /**
     * The filter's component.
     *
     * @var string
     */
    public $component = 'datepicker-filter';

    /**
     * Configure the picker mode.
     */
    public function mode(string $mode): static
    {
        if (! in_array($mode, [self::MODE_SINGLE, self::MODE_RANGE], true)) {
            throw new RuntimeException(sprintf(
                'Unsupported datepicker filter mode [%s]. Expected [%s] or [%s].',
                $mode,
                self::MODE_SINGLE,
                self::MODE_RANGE,
            ));
        }

        return $this->withMeta(['mode' => $mode]);
    }

    /**
     * Configure single-date mode.
     */
    public function single(): static
    {
        return $this->mode(self::MODE_SINGLE);
    }

    /**
     * Configure date-range mode.
     */
    public function range(): static
    {
        return $this->mode(self::MODE_RANGE);
    }

    /**
     * Set the locale used by the frontend datepicker.
     */
    public function locale(string $locale): static
    {
        return $this->withMeta(['locale' => $locale]);
    }

    /**
     * Set the placeholder used in single-date mode.
     */
    public function placeholder(string $placeholder): static
    {
        return $this->withMeta(['placeholder' => $placeholder]);
    }

    /**
     * Set the placeholder used for the start value in range mode.
     */
    public function startPlaceholder(string $startPlaceholder): static
    {
        return $this->withMeta(['startPlaceholder' => $startPlaceholder]);
    }

    /**
     * Set the placeholder used for the end value in range mode.
     */
    public function endPlaceholder(string $endPlaceholder): static
    {
        return $this->withMeta(['endPlaceholder' => $endPlaceholder]);
    }

    /**
     * Set placeholders for range mode.
     */
    public function rangePlaceholders(string $startPlaceholder, string $endPlaceholder): static
    {
        return $this
            ->startPlaceholder($startPlaceholder)
            ->endPlaceholder($endPlaceholder);
    }

    /**
     * Set defaults for JSON serialization.
     *
     * @return array{0: string|null, 1: string|null}|string|null
     */
    public function default(): mixed
    {
        if (Arr::get($this->meta(), 'mode') === self::MODE_RANGE) {
            return [null, null];
        }

        return null;
    }

    /**
     * Prepare the filter for JSON serialization.
     *
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return array_merge(parent::jsonSerialize(), [
            'mode' => Arr::get($this->meta(), 'mode', self::MODE_SINGLE),
            'locale' => (string) (Arr::get($this->meta(), 'locale', config('app.locale'))),
            'currentValue' => $this->default(),
        ]);
    }
}
