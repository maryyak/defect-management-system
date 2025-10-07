import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Базовые условия для фильтрации
        const where: any = {};

        if (projectId) {
            where.site = {
                projectId: projectId
            };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Получаем статистику по дефектам
        const defects = await prisma.defect.findMany({
            where,
            include: {
                site: {
                    include: {
                        project: true
                    }
                },
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
        });

        // Статистика по статусам
        const statusStats = await prisma.defect.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });

        // Статистика по приоритетам
        const priorityStats = await prisma.defect.groupBy({
            by: ['priority'],
            where,
            _count: {
                id: true
            }
        });

        // Статистика по проектам
        const projectStats = await prisma.defect.groupBy({
            by: ['siteId'],
            where,
            _count: {
                id: true
            },
            _max: {
                createdAt: true
            }
        });

        // Заполняем информацию о проектах для статистики
        const projectStatsWithInfo = await Promise.all(
            projectStats.map(async (stat) => {
                const site = await prisma.constructionSite.findUnique({
                    where: { id: stat.siteId },
                    include: {
                        project: true
                    }
                });

                return {
                    ...stat,
                    siteName: site?.name,
                    projectName: site?.project.name
                };
            })
        );

        const report = {
            totalDefects: defects.length,
            defects,
            statusStats,
            priorityStats,
            projectStats: projectStatsWithInfo,
            generatedAt: new Date().toISOString()
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json(
            { error: "Ошибка при формировании отчета" },
            { status: 500 }
        );
    }
}