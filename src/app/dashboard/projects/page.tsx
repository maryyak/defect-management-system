"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    createdAt: string;
    _count: {
        sites: number;
    };
    sites: Array<{
        _count: {
            defects: number;
        };
    }>;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch("/api/projects");
            if (!response.ok) {
                throw new Error("Ошибка при загрузке проектов");
            }
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm("Вы уверены, что хотите удалить этот проект?")) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            // Обновляем список после удаления
            fetchProjects();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Ошибка при удалении");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Загрузка...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Ошибка</div>
                <div className="text-red-600">{error}</div>
                <button
                    onClick={fetchProjects}
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
                <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
                <Link
                    href="/dashboard/projects/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    + Создать проект
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">Проектов пока нет</h3>
                    <p className="text-gray-600 mb-4">
                        Создайте первый проект для управления строительными объектами
                    </p>
                    <Link
                        href="/dashboard/projects/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Создать проект
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Link
                                        href={`/dashboard/projects/${project.id}`}
                                        className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 block"
                                    >
                                        {project.name}
                                    </Link>
                                    <div className="text-sm text-gray-600 mb-4">
                                        Создан: {new Date(project.createdAt).toLocaleDateString("ru-RU")}
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <span className="font-semibold">Объектов:</span>{" "}
                                            {project._count.sites}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Всего дефектов:</span>{" "}
                                            {project.sites.reduce(
                                                (total, site) => total + site._count.defects,
                                                0
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Link
                                        href={`/dashboard/projects/${project.id}`}
                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                                    >
                                        Подробнее
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}