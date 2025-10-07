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

interface DefectsListProps {
    siteId: string;
    siteName: string;
}

export default function DefectsList({ siteId, siteName }: DefectsListProps) {
    const [defects, setDefects] = useState<Defect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDefects();
    }, [siteId]);

    const fetchDefects = async () => {
        try {
            const response = await fetch(`/api/defects?siteId=${siteId}`);
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
            <div className="flex justify-center items-center h-32">
                <div className="text-lg">Загрузка дефектов...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Дефекты объекта
                    </h2>
                    <Link
                        href={`/dashboard/defects/new?siteId=${siteId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        + Добавить дефект
                    </Link>
                </div>
            </div>

            {error && (
                <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                    <div className="text-red-800">{error}</div>
                </div>
            )}

            <div className="divide-y divide-gray-200">
                {defects.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                        <p>Нет дефектов для этого объекта.</p>
                        <p className="text-sm mt-2">Создайте первый дефект для отслеживания проблем.</p>
                    </div>
                ) : (
                    defects.map((defect) => (
                        <div key={defect.id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(defect.priority)}`}>
                      Приоритет: {
                                            defect.priority === 'LOW' && 'Низкий'
                                            || defect.priority === 'MEDIUM' && 'Средний'
                                            || defect.priority === 'HIGH' && 'Высокий'
                                            || defect.priority === 'CRITICAL' && 'Критический'
                                        }
                    </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
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
                            <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                <span>Комментарии: {defect._count.comments}</span>
                                <span>Вложения: {defect._count.attachments}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}