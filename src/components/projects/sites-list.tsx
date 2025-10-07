"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Site {
    id: string;
    name: string;
    createdAt: string;
    _count: {
        defects: number;
    };
    defects: Array<{
        status: string;
    }>;
}

interface SitesListProps {
    projectId: string;
    projectName: string;
}

export default function SitesList({ projectId, projectName }: SitesListProps) {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSiteName, setNewSiteName] = useState("");

    useEffect(() => {
        fetchSites();
    }, [projectId]);

    const fetchSites = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/sites`);
            if (!response.ok) {
                throw new Error("Ошибка при загрузке объектов строительства");
            }
            const data = await response.json();
            setSites(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newSiteName.trim()) {
            alert("Введите название объекта");
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/sites`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: newSiteName }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            setNewSiteName("");
            setShowCreateForm(false);
            fetchSites(); // Обновляем список
        } catch (err) {
            alert(err instanceof Error ? err.message : "Ошибка при создании объекта");
        }
    };

    const handleDeleteSite = async (siteId: string) => {
        if (!confirm("Вы уверены, что хотите удалить этот объект строительства?")) {
            return;
        }

        try {
            const response = await fetch(`/api/sites/${siteId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            fetchSites();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Ошибка при удалении");
        }
    };

    const getDefectStats = (site: Site) => {
        const stats = {
            NEW: site.defects.filter(d => d.status === 'NEW').length,
            IN_PROGRESS: site.defects.filter(d => d.status === 'IN_PROGRESS').length,
            UNDER_REVIEW: site.defects.filter(d => d.status === 'UNDER_REVIEW').length,
            CLOSED: site.defects.filter(d => d.status === 'CLOSED').length,
            CANCELLED: site.defects.filter(d => d.status === 'CANCELLED').length,
        };

        return stats;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="text-lg">Загрузка объектов строительства...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Объекты строительства
                    </h2>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        + Добавить объект
                    </button>
                </div>
            </div>

            {showCreateForm && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <form onSubmit={handleCreateSite} className="flex gap-4">
                        <input
                            type="text"
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            placeholder="Название объекта строительства"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            Создать
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                            Отмена
                        </button>
                    </form>
                </div>
            )}

            <div className="divide-y divide-gray-200">
                {sites.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                        Нет объектов строительства. Создайте первый объект.
                    </div>
                ) : (
                    sites.map((site) => {
                        const stats = getDefectStats(site);

                        return (
                            <div key={site.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {site.name}
                                        </h3>
                                        <div className="text-sm text-gray-600 mb-3">
                                            Создан: {new Date(site.createdAt).toLocaleDateString("ru-RU")}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                                <span>Новые: {stats.NEW}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                                                <span>В работе: {stats.IN_PROGRESS}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                                <span>На проверке: {stats.UNDER_REVIEW}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                                <span>Завершено: {stats.CLOSED + stats.CANCELLED}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            href={`/dashboard/sites/${site.id}`}
                                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                                        >
                                            Дефекты ({site._count.defects})
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteSite(site.id)}
                                            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}