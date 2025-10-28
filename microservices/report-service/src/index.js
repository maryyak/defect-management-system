const express = require('express');
const cors = require('cors');
const moment = require('moment');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Имитация базы данных отчетов
let reports = [];
let reportStats = {
    totalGenerated: 0,
    lastGenerated: null
};

// Генерация отчета
app.post('/api/reports/generate', (req, res) => {
    const { type, format, filters } = req.body;

    const reportId = `RPT-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const reportData = {
        defects: Math.floor(Math.random() * 100) + 1,
        projects: Math.floor(Math.random() * 10) + 1,
        critical: Math.floor(Math.random() * 20),
        completed: Math.floor(Math.random() * 50)
    };

    const newReport = {
        id: reportId,
        type: type || 'defects',
        format: format || 'json',
        filters: filters || {},
        data: reportData,
        createdAt: timestamp,
        status: 'completed',
        downloadUrl: `/api/reports/download/${reportId}`
    };

    reports.unshift(newReport);
    reportStats.totalGenerated++;
    reportStats.lastGenerated = timestamp;

    console.log(`📊 Отчет сгенерирован: ${reportId}`);

    res.json({
        success: true,
        message: 'Отчет успешно сгенерирован',
        data: newReport
    });
});

// Скачивание отчета
app.get('/api/reports/download/:id', (req, res) => {
    const reportId = req.params.id;
    const report = reports.find(r => r.id === reportId);

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'Отчет не найден'
        });
    }

    if (report.format === 'csv') {
        // Генерация CSV
        const csvWriter = createObjectCsvWriter({
            path: `/tmp/report-${reportId}.csv`,
            header: [
                {id: 'metric', title: 'Метрика'},
                {id: 'value', title: 'Значение'}
            ]
        });

        const records = [
            {metric: 'Всего дефектов', value: report.data.defects},
            {metric: 'Количество проектов', value: report.data.projects},
            {metric: 'Критические дефекты', value: report.data.critical},
            {metric: 'Завершенные дефекты', value: report.data.completed}
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.csv`);

        res.send(`Метрика,Значение\nВсего дефектов,${report.data.defects}\nКоличество проектов,${report.data.projects}\nКритические дефекты,${report.data.critical}\nЗавершенные дефекты,${report.data.completed}`);
    } else {
        // Возврат JSON
        res.json({
            success: true,
            report: report
        });
    }
});

// Статистика отчетов
app.get('/api/reports/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            ...reportStats,
            reportsCount: reports.length
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Report Service',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Report Service запущен на порту ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});