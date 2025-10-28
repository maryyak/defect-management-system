#!/bin/bash

echo "🛑 Остановка микросервисов..."
docker stack rm defect-microservices
echo "✅ Микросервисы остановлены"