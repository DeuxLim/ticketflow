FROM php:8.2-cli-alpine

RUN apk add --no-cache bash git unzip libpq-dev oniguruma-dev \
    && docker-php-ext-install pdo_pgsql mbstring bcmath

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader \
    && php artisan config:clear \
    && php artisan route:clear

EXPOSE 10000

CMD ["sh", "-lc", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
