import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SitesList from "@/components/projects/sites-list";

interface ProjectDetailPageProps {
    params: {
        id: string;
    };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return <div>Не авторизован</div>;
    }

    // ДОБАВЬТЕ ЭТУ СТРОКУ - ожидаем params
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id }, // ← Используем id вместо params.id
        include: {
            sites: {
                include: {
                    _count: {
                        select: { defects: true }
                    },
                    defects: {
                        select: {
                            status: true
                        }
                    }
                }
            }
        }
    });

    if (!project) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Проект не найден</div>
                <Link
                    href="/dashboard/projects"
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                    ← Вернуться к проектам
                </Link>
            </div>
        );
    }

    // Статистика по дефектам
    const allDefects = project.sites.flatMap(site => site.defects);
    const defectsByStatus = {
        NEW: allDefects.filter(d => d.status === 'NEW').length,
        IN_PROGRESS: allDefects.filter(d => d.status === 'IN_PROGRESS').length,
        UNDER_REVIEW: allDefects.filter(d => d.status === 'UNDER_REVIEW').length,
        CLOSED: allDefects.filter(d => d.status === 'CLOSED').length,
        CANCELLED: allDefects.filter(d => d.status === 'CANCELLED').length,
    };

    const totalDefects = allDefects.length;

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
                    {project.name}
                </h1>
                <p className="text-gray-600">
                    Создан: {new Date(project.createdAt).toLocaleDateString("ru-RU")}
                </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-blue-600">{project.sites.length}</div>
                    <div className="text-sm text-gray-600">Объектов</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-orange-600">{totalDefects}</div>
                    <div className="text-sm text-gray-600">Всего дефектов</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-red-600">{defectsByStatus.NEW}</div>
                    <div className="text-sm text-gray-600">Новые</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-yellow-600">{defectsByStatus.IN_PROGRESS}</div>
                    <div className="text-sm text-gray-600">В работе</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-purple-600">{defectsByStatus.UNDER_REVIEW}</div>
                    <div className="text-sm text-gray-600">На проверке</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {defectsByStatus.CLOSED + defectsByStatus.CANCELLED}
                    </div>
                    <div className="text-sm text-gray-600">Завершено</div>
                </div>
            </div>

            {/* Список объектов строительства */}
            <SitesList projectId={id} projectName={project.name} /> {/* ← Используем id */}
        </div>
    );
}