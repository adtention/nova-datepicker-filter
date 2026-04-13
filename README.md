# Datepicker Filter for Laravel Nova

[![Tests](https://github.com/adtention/nova-datepicker-filter/actions/workflows/tests.yml/badge.svg)](https://github.com/adtention/nova-datepicker-filter/actions/workflows/tests.yml)

A Laravel Nova date filter built as a thin wrapper around [@vuepic/vue-datepicker](https://vue3datepicker.com/).

| Compatibility | Version |
| ---- | ----- |
| Laravel Nova | `^5.0` |
| PHP | `^8.4` |

## Installation

```bash
composer require adtention/nova-datepicker-filter
```

## Usage

Use `Datepicker` like any other Nova filter in your resource:

```php
TODO
```

### More examples

TODO

### Supported scope

This package is intentionally lightweight for public package use: it wraps `@vuepic/vue-datepicker` for Nova, but does **not** expose the full upstream prop/slot API.

- Input is normalized to `YYYY-MM-DD` before submission.
- The UI automatically follows Nova light/dark mode styling.
- Advanced vue-datepicker features (for example custom slots, full range/time presets, and all component props) are not guaranteed to be configurable via PHP at this time.

If you need additional functionality, pull requests are welcome as long as the API stays Nova-friendly.

## Development

Build for local environment:

```bash
git clone https://github.com/adtention/nova-datepicker-filter.git
cd nova-datepicker-filter
composer install
npm install
npm run dev
```

Build for release:

```bash
npm run prod
```

Run tests:

```bash
php vendor/bin/phpunit
```

Run a specific test:

```bash
php vendor/bin/phpunit --filter=it_defaults_locale_meta_to_the_application_locale
```

## License

MIT

## Credits

Developed by [Adtention A/S](https://adtention.dk)

![Adtention Logo](https://adtention.dk/wp-content/uploads/2020/09/github.png "We are Adtention; A creative digital agency")
