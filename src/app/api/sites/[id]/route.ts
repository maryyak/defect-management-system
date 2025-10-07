import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить объект строительства по ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // ДОБАВЬТЕ ЭТУ СТРОКУ
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
            return NextResponse.json({ error: "Объект не найден" }, { status: 404 });
        }

        return NextResponse.json(site);
    } catch (error) {
        console.error("Error fetching site:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке объекта строительства" },
            { status: 500 }
        );
    }
}

// PATCH - обновить объект строительства
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // ДОБАВЬТЕ ЭТУ СТРОКУ
        const { id } = await params;

        // Только менеджеры и инженеры могут обновлять объекты
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

        const site = await prisma.constructionSite.update({
            where: { id },
            data: {
                name: name.trim(),
            },
        });

        return NextResponse.json(site);
    } catch (error) {
        console.error("Error updating site:", error);
        return NextResponse.json(
            { error: "Ошибка при обновлении объекта строительства" },
            { status: 500 }
        );
    }
}

// DELETE - удалить объект строительства
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // ДОБАВЬТЕ ЭТУ СТРОКУ
        const { id } = await params;

        // Только менеджеры могут удалять объекты
        if (session.user.role !== 'MANAGER') {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        // Проверяем, есть ли связанные дефекты
        const siteWithDefects = await prisma.constructionSite.findUnique({
            where: { id },
            include: { defects: true }
        });

        if (siteWithDefects && siteWithDefects.defects.length > 0) {
            return NextResponse.json(
                { error: "Нельзя удалить объект с привязанными дефектами" },
                { status: 400 }
            );
        }

        await prisma.constructionSite.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Объект удален" });
    } catch (error) {
        console.error("Error deleting site:", error);
        return NextResponse.json(
            { error: "Ошибка при удалении объекта строительства" },
            { status: 500 }
        );
    }
}