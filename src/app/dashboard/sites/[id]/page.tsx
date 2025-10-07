import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DefectsList from "@/components/sites/defects-list";

interface SiteDetailPageProps {
    params: {
        id: string;
    };
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return <div>Не авторизован</div>;
    }

    const { id } = await params;

    const site = await prisma.constructionSite.findUnique({
        where: { id },
        include: {
            project: true,
            defects: {
                include: {
                    creator: {
                        select: { name: true, email: true }
                    },
                    assignee: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            _count: {
                select: { defects: true }
            }
        }
    });

    if (!site) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Объект не найден</div>
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
    const defectsByStatus = {
        NEW: site.defects.filter(d => d.status === 'NEW').length,
        IN_PROGRESS: site.defects.filter(d => d.status === 'IN_PROGRESS').length,
        UNDER_REVIEW: site.defects.filter(d => d.status === 'UNDER_REVIEW').length,
        CLOSED: site.defects.filter(d => d.status === 'CLOSED').length,
        CANCELLED: site.defects.filter(d => d.status === 'CANCELLED').length,
    };

    const totalDefects = site.defects.length;

    return (
        <div>
            <div className="mb-6">
                <Link
                    href={`/dashboard/projects/${site.project.id}`}
                    className="text-blue-600 hover:text-blue-800"
                >
                    ← Назад к проекту {site.project.name}
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                    {site.name}
                </h1>
                <p className="text-gray-600">
                    Проект: {site.project.name}
                </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalDefects}</div>
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
                        {defectsByStatus.CLOSED}
                    </div>
                    <div className="text-sm text-gray-600">Закрыто</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-2xl font-bold text-gray-600">
                        {defectsByStatus.CANCELLED}
                    </div>
                    <div className="text-sm text-gray-600">Отменено</div>
                </div>
            </div>

            {/* Список дефектов */}
            <DefectsList siteId={id} siteName={site.name} />
        </div>
    );
}