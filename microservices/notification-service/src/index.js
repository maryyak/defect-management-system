const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Имитация базы данных уведомлений
let notifications = [];

// Эмуляция email отправки - ИСПРАВЛЕНА ОПЕЧАТКА
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

// API для получения всех уведомлений
app.get('/api/notifications', (req, res) => {
    res.json({
        success: true,
        data: notifications,
        total: notifications.length
    });
});

// API для создания уведомления
app.post('/api/notifications', async (req, res) => {
    const { title, message, type, recipient } = req.body;

    const newNotification = {
        id: Date.now().toString(),
        title,
        message,
        type: type || 'info',
        recipient: recipient || 'all',
        createdAt: new Date().toISOString(),
        status: 'sent'
    };

    notifications.unshift(newNotification);

    // Ограничиваем историю 100 последними уведомлениями
    if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
    }

    // Логируем уведомление
    console.log(`🔔 Уведомление: ${title} - ${message}`);

    res.json({
        success: true,
        message: 'Уведомление отправлено',
        data: newNotification
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Notification Service',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Notification Service запущен на порту ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});