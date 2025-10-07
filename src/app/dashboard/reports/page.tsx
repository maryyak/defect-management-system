"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    sites: Array<{
        id: string;
        name: string;
    }>;
}

interface ReportData {
    totalDefects: number;
    defects: any[];
    statusStats: Array<{
        status: string;
        _count: { id: number };
    }>;
    priorityStats: Array<{
        priority: string;
        _count: { id: number };
    }>;
    projectStats: Array<{
        siteId: string;
        siteName: string;
        projectName: string;
        _count: { id: number };
        _max: { createdAt: string };
    }>;
    generatedAt: string;
}

export default function ReportsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Фильтры
    const [selectedProject, setSelectedProject] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch("/api/projects");
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (selectedProject) params.append('projectId', selectedProject);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`/api/reports?${params}`);
            if (!response.ok) {
                throw new Error("Ошибка при формировании отчета");
            }

            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData) return;

        const headers = [
            'ID',
            'Название',
            'Статус',
            'Приоритет',
            'Проект',
            'Объект',
            'Создатель',
            'Исполнитель',
            'Дата создания',
            'Срок выполнения'
        ].join(',');

        const rows = reportData.defects.map(defect => [
            defect.id,
            `"${defect.title}"`,
            defect.status,
            defect.priority,
            `"${defect.site.project.name}"`,
            `"${defect.site.name}"`,
            `"${defect.creator.name || defect.creator.email}"`,
            `"${defect.assignee?.name || defect.assignee?.email || 'Не назначен'}"`,
            new Date(defect.createdAt).toLocaleDateString('ru-RU'),
            defect.deadline ? new Date(defect.deadline).toLocaleDateString('ru-RU') : 'Не указан'
        ].join(','));

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `отчет_дефектов_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'NEW': 'Новые',
            'IN_PROGRESS': 'В работе',
            'UNDER_REVIEW': 'На проверке',
            'CLOSED': 'Закрытые',
            'CANCELLED': 'Отмененные'
        };
        return statusMap[status] || status;
    };

    const getPriorityText = (priority: string) => {
        const priorityMap: { [key: string]: string } = {
            'LOW': 'Низкий',
            'MEDIUM': 'Средний',
            'HIGH': 'Высокий',
            'CRITICAL': 'Критический'
        };
        return priorityMap[priority] || priority;
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Отчеты</h1>
                <p className="text-gray-600">
                    Генерация отчетов по дефектам с фильтрацией
                </p>
            </div>

            {/* Фильтры */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Параметры отчета</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Проект
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все проекты</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Дата с
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Дата по
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Формирование..." : "Сформировать отчет"}
                    </button>

                    {reportData && (
                        <button
                            onClick={exportToCSV}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                            Экспорт в CSV
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="text-red-800 font-semibold">Ошибка</div>
                    <div className="text-red-600">{error}</div>
                </div>
            )}

            {reportData && (
                <div className="space-y-6">
                    {/* Общая статистика */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Общая статистика</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{reportData.totalDefects}</div>
                                <div className="text-sm text-gray-600">Всего дефектов</div>
                            </div>

                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {reportData.statusStats.find(s => s.status === 'CLOSED')?._count.id || 0}
                                </div>
                                <div className="text-sm text-gray-600">Закрыто дефектов</div>
                            </div>

                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">
                                    {reportData.statusStats
                                        .filter(s => s.status !== 'CLOSED' && s.status !== 'CANCELLED')
                                        .reduce((total, s) => total + s._count.id, 0)}
                                </div>
                                <div className="text-sm text-gray-600">Открытых дефектов</div>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {reportData.priorityStats.find(p => p.priority === 'CRITICAL')?._count.id || 0}
                                </div>
                                <div className="text-sm text-gray-600">Критических дефектов</div>
                            </div>
                        </div>
                    </div>

                    {/* Статистика по статусам */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Статистика по статусам</h2>
                        <div className="space-y-3">
                            {reportData.statusStats.map(stat => (
                                <div key={stat.status} className="flex justify-between items-center">
                                    <span className="text-gray-700">{getStatusText(stat.status)}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{stat._count.id}</span>
                                        <span className="text-sm text-gray-500">
                      ({Math.round((stat._count.id / reportData.totalDefects) * 100)}%)
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Статистика по проектам */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Статистика по проектам</h2>
                        <div className="space-y-3">
                            {reportData.projectStats.map(stat => (
                                <div key={stat.siteId} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{stat.projectName}</div>
                                        <div className="text-sm text-gray-600">{stat.siteName}</div>
                                    </div>
                                    <span className="font-semibold">{stat._count.id} дефектов</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Список дефектов */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Детализация дефектов</h2>
                            <div className="text-sm text-gray-500">
                                Сформировано: {new Date(reportData.generatedAt).toLocaleString('ru-RU')}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Дефект
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Статус
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Приоритет
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Объект
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Создан
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.defects.slice(0, 10).map(defect => (
                                    <tr key={defect.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{defect.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            defect.status === 'NEW' ? 'bg-red-100 text-red-800' :
                                defect.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                    defect.status === 'UNDER_REVIEW' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'
                        }`}>
                          {getStatusText(defect.status)}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getPriorityText(defect.priority)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {defect.site.project.name} → {defect.site.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(defect.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {reportData.defects.length > 10 && (
                            <div className="mt-4 text-center text-sm text-gray-500">
                                Показано 10 из {reportData.defects.length} дефектов
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}