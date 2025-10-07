import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить все объекты строительства для проекта
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // ДОБАВЬТЕ ЭТУ СТРОКУ - ожидаем params
        const { id } = await params;

        const sites = await prisma.constructionSite.findMany({
            where: { projectId: id },  // ← Используем id вместо params.id
            include: {
                _count: {
                    select: { defects: true }
                },
                defects: {
                    select: {
                        status: true
                    }
                }
            },
            // ИСПРАВЛЕННЫЙ orderBy - используем существующие поля
            orderBy: {
                name: 'asc'  // Сортируем по имени вместо createdAt
            }
        });

        return NextResponse.json(sites);
    } catch (error) {
        console.error("Error fetching sites:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке объектов строительства" },
            { status: 500 }
        );
    }
}

// POST - создать новый объект строительства
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // Только менеджеры и инженеры могут создавать объекты
        if (!['MANAGER', 'ENGINEER'].includes(session.user.role)) {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Название объекта обязательно" },
                { status: 400 }
            );
        }

        // ДОБАВЬТЕ ЭТУ СТРОКУ - ожидаем params
        const { id } = await params;

        // Проверяем существование проекта
        const project = await prisma.project.findUnique({
            where: { id }
        });

        if (!project) {
            return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
        }

        const site = await prisma.constructionSite.create({
            data: {
                name: name.trim(),
                projectId: id,
            },
        });

        return NextResponse.json(site);
    } catch (error) {
        console.error("Error creating site:", error);
        return NextResponse.json(
            { error: "Ошибка при создании объекта строительства" },
            { status: 500 }
        );
    }
}