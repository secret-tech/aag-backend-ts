# Askagirl backend

Backend  module for the best mobile live coaching app ever.

## How to start development and run tests

1. Clone this repo
1. Run `docker-compose build --no-cache`
1. Run `docker-compose up -d`
1. Run `cp .env.example .env`
1. To install dependencies run `docker-compose exec backend yarn`
1. Run tests `docker-compose exec backend yarn test`