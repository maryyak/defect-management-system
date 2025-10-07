"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Defect {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    createdAt: string;
    deadline?: string;
    site: {
        id: string;
        name: string;
        project: {
            id: string;
            name: string;
        };
    };
    creator: {
        name?: string;
        email: string;
    };
    assignee?: {
        name?: string;
        email: string;
    };
    _count: {
        comments: number;
        attachments: number;
    };
}

export default function DefectsPage() {
    const [defects, setDefects] = useState<Defect[]>([]);
    const [filteredDefects, setFilteredDefects] = useState<Defect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchDefects();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [defects, statusFilter, priorityFilter, searchTerm]);

    const fetchDefects = async () => {
        try {
            const response = await fetch("/api/defects");
            if (!response.ok) {
                throw new Error("Ошибка при загрузке дефектов");
            }
            const data = await response.json();
            setDefects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = defects;

        // Фильтр по статусу
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(defect => defect.status === statusFilter);
        }

        // Фильтр по приоритету
        if (priorityFilter !== "ALL") {
            filtered = filtered.filter(defect => defect.priority === priorityFilter);
        }

        // Поиск по названию и описанию
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(defect =>
                defect.title.toLowerCase().includes(term) ||
                (defect.description && defect.description.toLowerCase().includes(term))
            );
        }

        setFilteredDefects(filtered);
    };

    const clearFilters = () => {
        setStatusFilter("ALL");
        setPriorityFilter("ALL");
        setSearchTerm("");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-red-100 text-red-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
            case 'CLOSED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'CRITICAL': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDelete = async (defectId: string) => {
        if (!confirm("Вы уверены, что хотите удалить этот дефект?")) {
            return;
        }

        try {
            const response = await fetch(`/api/defects/${defectId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            fetchDefects();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Ошибка при удалении");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Загрузка дефектов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Ошибка</div>
                <div className="text-red-600">{error}</div>
                <button
                    onClick={fetchDefects}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Дефекты</h1>
                <Link
                    href="/dashboard/defects/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    + Создать дефект
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Поиск
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Название или описание..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Статус
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">Все статусы</option>
                            <option value="NEW">Новые</option>
                            <option value="IN_PROGRESS">В работе</option>
                            <option value="UNDER_REVIEW">На проверке</option>
                            <option value="CLOSED">Закрытые</option>
                            <option value="CANCELLED">Отмененные</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Приоритет
                        </label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">Все приоритеты</option>
                            <option value="LOW">Низкий</option>
                            <option value="MEDIUM">Средний</option>
                            <option value="HIGH">Высокий</option>
                            <option value="CRITICAL">Критический</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    Найдено дефектов: {filteredDefects.length}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Загрузка дефектов...</div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-semibold">Ошибка</div>
                    <div className="text-red-600">{error}</div>
                    <button
                        onClick={fetchDefects}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Попробовать снова
                    </button>
                </div>
            ) : filteredDefects.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">
                        {defects.length === 0 ? "Дефектов пока нет" : "Дефекты не найдены"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {defects.length === 0
                            ? "Создайте первый дефект для отслеживания проблем на объектах"
                            : "Попробуйте изменить параметры фильтрации"
                        }
                    </p>
                    <Link
                        href="/dashboard/defects/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Создать дефект
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredDefects.map((defect) => (
                        <div
                            key={defect.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {defect.title}
                                    </h3>
                                    {defect.description && (
                                        <p className="text-gray-600 mb-3">{defect.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(defect.status)}`}>
                      {defect.status === 'NEW' && 'Новый'}
                        {defect.status === 'IN_PROGRESS' && 'В работе'}
                        {defect.status === 'UNDER_REVIEW' && 'На проверке'}
                        {defect.status === 'CLOSED' && 'Закрыт'}
                        {defect.status === 'CANCELLED' && 'Отменен'}
                    </span>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(defect.priority)}`}>
                      Приоритет: {
                                            defect.priority === 'LOW' && 'Низкий'
                                            || defect.priority === 'MEDIUM' && 'Средний'
                                            || defect.priority === 'HIGH' && 'Высокий'
                                            || defect.priority === 'CRITICAL' && 'Критический'
                                        }
                    </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div>Проект: {defect.site.project.name} → {defect.site.name}</div>
                                        <div>Создал: {defect.creator.name || defect.creator.email}</div>
                                        {defect.assignee && (
                                            <div>Исполнитель: {defect.assignee.name || defect.assignee.email}</div>
                                        )}
                                        {defect.deadline && (
                                            <div>Срок: {new Date(defect.deadline).toLocaleDateString("ru-RU")}</div>
                                        )}
                                        <div>Создан: {new Date(defect.createdAt).toLocaleDateString("ru-RU")}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Link
                                        href={`/dashboard/defects/${defect.id}`}
                                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                                    >
                                        Подробнее
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(defect.id)}
                                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <span>Комментарии: {defect._count.comments}</span>
                                <span>Вложения: {defect._count.attachments}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}