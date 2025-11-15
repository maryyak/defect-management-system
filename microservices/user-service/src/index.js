const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
let users = [];
let userIdCounter = 1;

// Схемы валидации
const RegisterSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
});

const LoginSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(1, 'Пароль обязателен'),
});

const UpdateProfileSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
});

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Требуется аутентификация' },
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Недействительный токен' },
            });
        }
        req.user = user;
        next();
    });
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Недостаточно прав' },
        });
    }
    next();
};

// Регистрация пользователя
app.post('/v1/users/register', async (req, res) => {
    try {
        const validatedData = RegisterSchema.parse(req.body);
        const { email, password, name } = validatedData;

        // Проверка существования пользователя
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: { code: 'USER_EXISTS', message: 'Пользователь с таким email уже существует' },
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const user = {
            id: uuidv4(),
            email,
            password: hashedPassword,
            name,
            role: 'USER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        users.push(user);

        req.logger.info({ userId: user.id }, 'Пользователь зарегистрирован');

        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
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

        req.logger.error({ error: error.message }, 'Ошибка при регистрации');
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
        });
    }
});

// Вход пользователя
app.post('/v1/users/login', async (req, res) => {
    try {
        const validatedData = LoginSchema.parse(req.body);
        const { email, password } = validatedData;

        // Поиск пользователя
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' },
            });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' },
            });
        }

        // Генерация JWT токена
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        req.logger.info({ userId: user.id }, 'Пользователь вошел в систему');

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
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

        req.logger.error({ error: error.message }, 'Ошибка при входе');
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
        });
    }
});

// Получение профиля текущего пользователя
app.get('/v1/users/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' },
        });
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
});

// Обновление профиля
app.put('/v1/users/profile', authenticateToken, (req, res) => {
    try {
        const validatedData = UpdateProfileSchema.parse(req.body);

        const userIndex = users.findIndex(u => u.id === req.user.userId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' },
            });
        }

        users[userIndex] = {
            ...users[userIndex],
            ...validatedData,
            updatedAt: new Date().toISOString(),
        };

        req.logger.info({ userId: req.user.userId }, 'Профиль пользователя обновлен');

        res.json({
            success: true,
            data: {
                id: users[userIndex].id,
                email: users[userIndex].email,
                name: users[userIndex].name,
                role: users[userIndex].role,
                createdAt: users[userIndex].createdAt,
                updatedAt: users[userIndex].updatedAt,
            },
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

        req.logger.error({ error: error.message }, 'Ошибка при обновлении профиля');
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
        });
    }
});

// Список пользователей (только для администраторов)
app.get('/v1/users', authenticateToken, requireAdmin, (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let filteredUsers = users;

    // Фильтрация по поиску
    if (search) {
        filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Пагинация
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const responseData = paginatedUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }));

    res.json({
        success: true,
        data: responseData,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: filteredUsers.length,
            pages: Math.ceil(filteredUsers.length / limitNum),
        },
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'OK',
            service: 'User Service',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        },
    });
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
    req.logger.error({ error: error.message }, 'Необработанная ошибка');
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    });
});

app.listen(PORT, () => {
    logger.info(`🚀 User Service запущен на порту ${PORT}`);
});