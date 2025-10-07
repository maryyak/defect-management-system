import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить все дефекты с фильтрацией
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        const defects = await prisma.defect.findMany({
            where: {
                ...(siteId && { siteId }),
                ...(status && { status }),
                ...(priority && { priority }),
            },
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
                },
                _count: {
                    select: { comments: true, attachments: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(defects);
    } catch (error) {
        console.error("Error fetching defects:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке дефектов" },
            { status: 500 }
        );
    }
}

// POST - создать новый дефект
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // Только менеджеры и инженеры могут создавать дефекты
        if (!['MANAGER', 'ENGINEER'].includes(session.user.role)) {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        const { title, description, priority, siteId, assigneeId, deadline } = await request.json();

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { error: "Название дефекта обязательно" },
                { status: 400 }
            );
        }

        if (!siteId) {
            return NextResponse.json(
                { error: "Объект строительства обязателен" },
                { status: 400 }
            );
        }

        // Проверяем существование объекта строительства
        const site = await prisma.constructionSite.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            return NextResponse.json({ error: "Объект строительства не найден" }, { status: 404 });
        }

        const defect = await prisma.defect.create({
            data: {
                title: title.trim(),
                description: description?.trim(),
                priority: priority || 'MEDIUM',
                siteId,
                creatorId: session.user.id,
                assigneeId: assigneeId || null,
                deadline: deadline ? new Date(deadline) : null,
            },
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
            }
        });

        return NextResponse.json(defect);
    } catch (error) {
        console.error("Error creating defect:", error);
        return NextResponse.json(
            { error: "Ошибка при создании дефекта" },
            { status: 500 }
        );
    }
}