# Микросервисы для системы управления дефектами

## Структура
- `notification-service/` - Сервис уведомлений
- `report-service/` - Сервис отчетов
- `nginx/` - Конфигурация Nginx
- `docker-compose.yml` - Docker Compose для разработки
- `docker-compose.swarm.yml` - Docker Swarm для продакшена

## Быстрый старт

### Разработка
```bash
docker-compose up -d --build