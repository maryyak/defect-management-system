#!/bin/bash

set -e

echo "🚀 Запуск деплоя микросервисов..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

# Сборка образов
echo "📦 Сборка Docker образов..."
docker build -t defect-notification-service:latest ./notification-service
docker build -t defect-report-service:latest ./report-service

# Деплой в Swarm
echo "🐳 Деплой в Docker Swarm..."
docker stack deploy -c docker-compose.swarm.yml defect-microservices

echo "✅ Деплой завершен!"
echo "📊 Статус сервисов:"
docker stack services defect-microservices