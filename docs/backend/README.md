# Ticketing Backend

Laravel 12 API for the Ticketing workspace helpdesk application.

## Stack

- Laravel 12
- Sanctum API authentication
- SQLite/MySQL-compatible migrations
- PHPUnit feature tests

## Local Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Seeded demo users are documented in `docs/SEED_CREDENTIALS.md`.

## Development

```bash
php artisan serve
php artisan queue:listen --tries=1 --timeout=0
php artisan pail --timeout=0
```

The React app runs separately from `frontend/`.

## Verification

```bash
composer test
./vendor/bin/pint --dirty --test
```

Feature coverage lives in `tests/Feature/`. Prefer feature tests for API behavior so routes, middleware, validation, authorization, and persistence are verified together.
