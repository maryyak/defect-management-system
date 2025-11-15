const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3002;

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

// Middleware для логирования
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    req.logger = logger.child({ requestId });
    next();
});

app.use(cors());
app.use(express.json());

// Имитация базы данных
let defects = [];
let defectIdCounter = 1;

// Статусы дефектов
const DEFECT_STATUS = {
    CREATED: 'created',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Схемы валидации
const CreateDefectSchema = z.object({
    title: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    siteId: z.string().min(1, 'ID объекта обязателен'),
});

const UpdateDefectSchema = z.object({
    title: z.string().min(1, 'Название обязательно').optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['created', 'in_progress', 'completed', 'cancelled']).optional(),
});

// Middleware для извлечения пользователя из JWT
const extractUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            // В реальном приложении здесь была бы проверка JWT
            const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            req.user = user;
        } catch (error) {
            // В демо-режиме используем заглушку
            req.user = { userId: 'demo-user', role: 'USER' };
        }
    } else {
        req.user = { userId: 'demo-user', role: 'USER' };
    }
    next();
};

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Требуется аутентификация' },
        });
    }
    next();
};

// Создание дефекта
app.post('/v1/defects', requireAuth, (req, res) => {
    try {
        const validatedData = CreateDefectSchema.parse(req.body);

        const defect = {
            id: uuidv4(),
            userId: req.user.userId,
            ...validatedData,
            status: DEFECT_STATUS.CREATED,
            total: Math.floor(Math.random() * 10000) + 1000, // Имитация суммы
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        defects.push(defect);

        req.logger.info({ defectId: defect.id, userId: req.user.userId }, 'Дефект создан');

        // Публикация события (заготовка для брокера сообщений)
        publishEvent('defect_created', {
            defectId: defect.id,
            userId: req.user.userId,
            title: defect.title,
            status: defect.status,
        });

        res.status(201).json({
            success: true,
            data: defect,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Ошибка валидации',
                    details: error.errors,
                },
            });
        }

        req.logger.error({ error: error.message }, 'Ошибка при создании дефекта');
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
        });
    }
});

// Получение дефекта по ID
app.get('/v1/defects/:id', requireAuth, (req, res) => {
    const defect = defects.find(d => d.id === req.params.id);

    if (!defect) {
        return res.status(404).json({
            success: false,
            error: { code: 'DEFECT_NOT_FOUND', message: 'Дефект не найден' },
        });
    }

    // Проверка прав доступа
    if (defect.userId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Нет доступа к этому дефекту' },
        });
    }

    res.json({
        success: true,
        data: defect,
    });
});

// Список дефектов текущего пользователя
app.get('/v1/defects', requireAuth, (req, res) => {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let userDefects = defects.filter(d => d.userId === req.user.userId);

    // Фильтрация по статусу
    if (status) {
        userDefects = userDefects.filter(d => d.status === status);
    }

    // Сортировка
    userDefects.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        return aValue < bValue ? -1 * multiplier : 1 * multiplier;
    });

    // Пагинация
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedDefects = userDefects.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedDefects,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: userDefects.length,
            pages: Math.ceil(userDefects.length / limitNum),
        },
    });
});

// Обновление статуса дефекта
app.patch('/v1/defects/:id/status', requireAuth, (req, res) => {
    try {
        const { status } = req.body;

        if (!Object.values(DEFECT_STATUS).includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'Некорректный статус' },
            });
        }

        const defectIndex = defects.findIndex(d => d.id === req.params.id);
        if (defectIndex === -1) {
            return res.status(404).json({
                success: false,
                error: { code: 'DEFECT_NOT_FOUND', message: 'Дефект не найден' },
            });
        }

        // Проверка прав доступа
        if (defects[defectIndex].userId !== req.user.userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Нет доступа к этому дефекту' },
            });
        }

        const oldStatus = defects[defectIndex].status;
        defects[defectIndex] = {
            ...defects[defectIndex],
            status,
            updatedAt: new Date().toISOString(),
        };

        req.logger.info(
            { defectId: req.params.id, oldStatus, newStatus: status },
            'Статус дефекта обновлен'
        );

        // Публикация события
        publishEvent('defect_status_updated', {
            defectId: req.params.id,
            userId: req.user.userId,
            oldStatus,
            newStatus: status,
        });

        res.json({
            success: true,
            data: defects[defectIndex],
        });
    } catch (error) {
        req.logger.error({ error: error.message }, 'Ошибка при обновлении статуса дефекта');
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
        });
    }
});

// Отмена дефекта
app.delete('/v1/defects/:id', requireAuth, (req, res) => {
    const defectIndex = defects.findIndex(d => d.id === req.params.id);

    if (defectIndex === -1) {
        return res.status(404).json({
            success: false,
            error: { code: 'DEFECT_NOT_FOUND', message: 'Дефект не найден' },
        });
    }

    // Проверка прав доступа
    if (defects[defectIndex].userId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Нет доступа к этому дефекту' },
        });
    }

    const cancelledDefect = {
        ...defects[defectIndex],
        status: DEFECT_STATUS.CANCELLED,
        updatedAt: new Date().toISOString(),
    };

    defects[defectIndex] = cancelledDefect;

    req.logger.info({ defectId: req.params.id }, 'Дефект отменен');

    res.json({
        success: true,
        data: cancelledDefect,
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'OK',
            service: 'Defect Service',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        },
    });
});

// Заглушка для публикации событий
function publishEvent(eventType, payload) {
    console.log(`[Event Published] ${eventType}:`, payload);
    // В реальном приложении здесь была бы отправка в брокер сообщений
}

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
    req.logger.error({ error: error.message }, 'Необработанная ошибка');
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    });
});

app.listen(PORT, () => {
    logger.info(`🚀 Defect Service запущен на порту ${PORT}`);
});