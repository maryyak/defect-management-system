import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    // Получим расширенную статистику
    const [
        projectsCount,
        sitesCount,
        defectsCount,
        defectsByStatus,
        defectsByPriority,
        recentDefects
    ] = await Promise.all([
        // Количество проектов
        prisma.project.count(),

        // Количество объектов
        prisma.constructionSite.count(),

        // Общее количество дефектов
        prisma.defect.count(),

        // Дефекты по статусам
        prisma.defect.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        }),

        // Дефекты по приоритетам
        prisma.defect.groupBy({
            by: ['priority'],
            _count: {
                id: true
            }
        }),

        // Последние дефекты
        prisma.defect.findMany({
            take: 5,
            include: {
                site: {
                    include: {
                        project: true
                    }
                },
                creator: {
                    select: { name: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    ]);

    const openDefectsCount = defectsByStatus
        .filter(d => d.status !== 'CLOSED' && d.status !== 'CANCELLED')
        .reduce((total, d) => total + d._count.id, 0);

    // Преобразуем данные для удобного отображения
    const statusStats = {
        NEW: defectsByStatus.find(d => d.status === 'NEW')?._count.id || 0,
        IN_PROGRESS: defectsByStatus.find(d => d.status === 'IN_PROGRESS')?._count.id || 0,
        UNDER_REVIEW: defectsByStatus.find(d => d.status === 'UNDER_REVIEW')?._count.id || 0,
        CLOSED: defectsByStatus.find(d => d.status === 'CLOSED')?._count.id || 0,
        CANCELLED: defectsByStatus.find(d => d.status === 'CANCELLED')?._count.id || 0,
    };

    const priorityStats = {
        LOW: defectsByPriority.find(d => d.priority === 'LOW')?._count.id || 0,
        MEDIUM: defectsByPriority.find(d => d.priority === 'MEDIUM')?._count.id || 0,
        HIGH: defectsByPriority.find(d => d.priority === 'HIGH')?._count.id || 0,
        CRITICAL: defectsByPriority.find(d => d.priority === 'CRITICAL')?._count.id || 0,
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Панель управления</h1>

            {/* Основная статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Проекты</h3>
                    <p className="text-3xl font-bold text-blue-600">{projectsCount}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Объекты</h3>
                    <p className="text-3xl font-bold text-green-600">{sitesCount}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Всего дефектов</h3>
                    <p className="text-3xl font-bold text-orange-600">{defectsCount}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Открытые дефекты</h3>
                    <p className="text-3xl font-bold text-red-600">{openDefectsCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Статистика по статусам */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Дефекты по статусам</h2>
                    <div className="space-y-3">
                        {Object.entries(statusStats).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700">
                  {status === 'NEW' && 'Новые'}
                    {status === 'IN_PROGRESS' && 'В работе'}
                    {status === 'UNDER_REVIEW' && 'На проверке'}
                    {status === 'CLOSED' && 'Закрытые'}
                    {status === 'CANCELLED' && 'Отмененные'}
                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{count}</span>
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                status === 'NEW' ? '#ef4444' :
                                                    status === 'IN_PROGRESS' ? '#eab308' :
                                                        status === 'UNDER_REVIEW' ? '#a855f7' :
                                                            status === 'CLOSED' ? '#22c55e' : '#6b7280'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Статистика по приоритетам */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Дефекты по приоритетам</h2>
                    <div className="space-y-3">
                        {Object.entries(priorityStats).map(([priority, count]) => (
                            <div key={priority} className="flex justify-between items-center">
                <span className="text-gray-700">
                  {priority === 'LOW' && 'Низкий'}
                    {priority === 'MEDIUM' && 'Средний'}
                    {priority === 'HIGH' && 'Высокий'}
                    {priority === 'CRITICAL' && 'Критический'}
                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{count}</span>
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                priority === 'LOW' ? '#22c55e' :
                                                    priority === 'MEDIUM' ? '#eab308' :
                                                        priority === 'HIGH' ? '#f97316' : '#ef4444'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Последние дефекты */}
            <div className="bg-white p-6 rounded-lg shadow mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Последние дефекты</h2>
                    <Link
                        href="/dashboard/defects"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Все дефекты →
                    </Link>
                </div>

                {recentDefects.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Нет дефектов</p>
                ) : (
                    <div className="space-y-4">
                        {recentDefects.map((defect) => (
                            <div key={defect.id} className="border-b border-gray-200 pb-4 last:border-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{defect.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            {defect.site.project.name} → {defect.site.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Создал: {defect.creator.name || defect.creator.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        defect.status === 'NEW' ? 'bg-red-100 text-red-800' :
                            defect.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                defect.status === 'UNDER_REVIEW' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                    }`}>
                      {defect.status === 'NEW' && 'Новый'}
                        {defect.status === 'IN_PROGRESS' && 'В работе'}
                        {defect.status === 'UNDER_REVIEW' && 'На проверке'}
                    </span>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(defect.createdAt).toLocaleDateString("ru-RU")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow mt-8">
                <h2 className="text-xl font-semibold mb-4">Добро пожаловать, {session?.user?.name || session?.user?.email}!</h2>
                <p className="text-gray-600">
                    Используйте навигацию для работы с проектами, дефектами и отчетами.
                </p>
            </div>
        </div>
    );
}