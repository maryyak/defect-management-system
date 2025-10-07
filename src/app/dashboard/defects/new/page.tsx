"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ConstructionSite {
    id: string;
    name: string;
    project: {
        id: string;
        name: string;
    };
}

interface User {
    id: string;
    name: string | null;
    email: string;
}

export default function NewDefectPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [siteId, setSiteId] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sites, setSites] = useState<ConstructionSite[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Если перешли с страницы объекта, устанавливаем siteId из query параметра
        const siteIdFromQuery = searchParams.get('siteId');
        if (siteIdFromQuery) {
            setSiteId(siteIdFromQuery);
        }

        fetchSites();
        fetchUsers();
    }, [searchParams]);

    const fetchSites = async () => {
        try {
            const response = await fetch("/api/projects");
            if (!response.ok) {
                throw new Error("Ошибка при загрузке проектов");
            }
            const projects = await response.json();

            const allSites: ConstructionSite[] = [];
            projects.forEach((project: any) => {
                project.sites.forEach((site: any) => {
                    allSites.push({
                        id: site.id,
                        name: site.name,
                        project: {
                            id: project.id,
                            name: project.name
                        }
                    });
                });
            });

            setSites(allSites);
        } catch (err) {
            console.error("Error fetching sites:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            // В реальном приложении здесь должен быть endpoint для пользователей
            // Пока используем заглушку - можно расширить позже
            setUsers([]);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/defects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    siteId,
                    assigneeId: assigneeId || null,
                    deadline: deadline || null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            router.push("/dashboard/defects");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка при создании дефекта");
        } finally {
            setLoading(false);
        }
    };

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
                    Создание дефекта
                </h1>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-800">{error}</div>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Название дефекта *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Введите название дефекта"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Описание
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Опишите дефект подробнее..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="priority"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Приоритет *
                            </label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="LOW">Низкий</option>
                                <option value="MEDIUM">Средний</option>
                                <option value="HIGH">Высокий</option>
                                <option value="CRITICAL">Критический</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="site"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Объект строительства *
                            </label>
                            <select
                                id="site"
                                value={siteId}
                                onChange={(e) => setSiteId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите объект</option>
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.project.name} → {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="assignee"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Исполнитель
                            </label>
                            <select
                                id="assignee"
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Не назначен</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="deadline"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Срок выполнения
                            </label>
                            <input
                                type="date"
                                id="deadline"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? "Создание..." : "Создать дефект"}
                        </button>
                        <Link
                            href="/dashboard/defects"
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}