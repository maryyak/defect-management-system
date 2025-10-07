"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            router.push("/dashboard/projects");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка при создании проекта");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <Link
                    href="/dashboard/projects"
                    className="text-blue-600 hover:text-blue-800"
                >
                    ← Назад к проектам
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                    Создание проекта
                </h1>
            </div>

            <div className="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-800">{error}</div>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Название проекта *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Введите название проекта"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? "Создание..." : "Создать проект"}
                        </button>
                        <Link
                            href="/dashboard/projects"
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