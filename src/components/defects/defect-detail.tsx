"use client";

import { useState } from "react";
import Link from "next/link";

interface User {
    id: string;
    name?: string | null;  // ← Разрешаем null
    email: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: User;
}

interface Defect {
    id: string;
    title: string;
    description?: string | null;  // ← Разрешаем null
    status: string;
    priority: string;
    createdAt: string;
    deadline?: string | null;  // ← Разрешаем null
    site: {
        id: string;
        name: string;
        project: {
            id: string;
            name: string;
        };
    };
    creator: User;
    assignee?: User | null;  // ← Разрешаем null
    comments?: Comment[] | null;  // ← Разрешаем null
    attachments: any[];
}

interface DefectDetailProps {
    defect: Defect;
    session: any;
}

export default function DefectDetail({ defect, session }: DefectDetailProps) {
    const [currentDefect, setCurrentDefect] = useState({
        ...defect,
        comments: defect.comments || [] // ← Гарантируем, что comments всегда массив
    });
    const [commentContent, setCommentContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const handleStatusChange = async (newStatus: string) => {
        try {
            const response = await fetch(`/api/defects/${currentDefect.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const updatedDefect = await response.json();
            setCurrentDefect(prev => ({
                ...updatedDefect,
                comments: prev.comments // ← Сохраняем существующие комментарии
            }));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса");
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/defects/${currentDefect.id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: commentContent }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const newComment = await response.json();

            // Обновляем дефект, добавляя новый комментарий
            setCurrentDefect({
                ...currentDefect,
                comments: [...currentDefect.comments, newComment],
            });

            setCommentContent("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка при добавлении комментария");
        } finally {
            setLoading(false);
        }
    };

    const canUpdateDefect =
        session.user.role === 'MANAGER' ||
        session.user.role === 'ENGINEER' ||
        currentDefect.assignee?.id === session.user.id;

    return (
        <div>
            <div className="mb-6">
                <Link
                    href="/dashboard/defects"
                    className="text-blue-600 hover:text-blue-800"
                >
                    ← Назад к дефектам
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                    {currentDefect.title}
                </h1>
                <p className="text-gray-600">
                    Проект: {currentDefect.site.project.name} → {currentDefect.site.name}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Основная информация */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Описание</h2>
                        <p className="text-gray-700">
                            {currentDefect.description || "Описание отсутствует"}
                        </p>
                    </div>

                    {/* Комментарии */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Комментарии</h2>

                        <form onSubmit={handleAddComment} className="mb-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="text-red-800">{error}</div>
                                </div>
                            )}
                            <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="Добавьте комментарий..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Добавление..." : "Добавить комментарий"}
                            </button>
                        </form>

                        <div className="space-y-4">
                            {(!currentDefect.comments || currentDefect.comments.length === 0) ? (
                                <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
                            ) : (
                                currentDefect.comments.map((comment) => (
                                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900">
                                                {comment.author.name || comment.author.email}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString("ru-RU")}
                                            </div>
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Сайдбар с информацией и действиями */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Информация</h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Статус</label>
                                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentDefect.status)}`}>
                    {currentDefect.status === 'NEW' && 'Новый'}
                      {currentDefect.status === 'IN_PROGRESS' && 'В работе'}
                      {currentDefect.status === 'UNDER_REVIEW' && 'На проверке'}
                      {currentDefect.status === 'CLOSED' && 'Закрыт'}
                      {currentDefect.status === 'CANCELLED' && 'Отменен'}
                  </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Приоритет</label>
                                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentDefect.priority)}`}>
                    {currentDefect.priority === 'LOW' && 'Низкий'}
                      {currentDefect.priority === 'MEDIUM' && 'Средний'}
                      {currentDefect.priority === 'HIGH' && 'Высокий'}
                      {currentDefect.priority === 'CRITICAL' && 'Критический'}
                  </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Создатель</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {currentDefect.creator.name || currentDefect.creator.email}
                                </p>
                            </div>

                            {currentDefect.assignee && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Исполнитель</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {currentDefect.assignee.name || currentDefect.assignee.email}
                                    </p>
                                </div>
                            )}

                            {currentDefect.deadline && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Срок выполнения</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(currentDefect.deadline).toLocaleDateString("ru-RU")}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-600">Создан</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {new Date(currentDefect.createdAt).toLocaleDateString("ru-RU")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Действия */}
                    {canUpdateDefect && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Действия</h2>

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleStatusChange('IN_PROGRESS')}
                                    disabled={currentDefect.status === 'IN_PROGRESS'}
                                    className="w-full bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm font-medium hover:bg-yellow-200 disabled:opacity-50"
                                >
                                    Взять в работу
                                </button>

                                <button
                                    onClick={() => handleStatusChange('UNDER_REVIEW')}
                                    disabled={currentDefect.status === 'UNDER_REVIEW'}
                                    className="w-full bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm font-medium hover:bg-purple-200 disabled:opacity-50"
                                >
                                    На проверку
                                </button>

                                <button
                                    onClick={() => handleStatusChange('CLOSED')}
                                    disabled={currentDefect.status === 'CLOSED'}
                                    className="w-full bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium hover:bg-green-200 disabled:opacity-50"
                                >
                                    Закрыть
                                </button>

                                <button
                                    onClick={() => handleStatusChange('CANCELLED')}
                                    disabled={currentDefect.status === 'CANCELLED'}
                                    className="w-full bg-gray-100 text-gray-800 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Отменить
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}