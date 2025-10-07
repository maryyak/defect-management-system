import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить проект по ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                sites: {
                    include: {
                        _count: {
                            select: { defects: true }
                        }
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке проекта" },
            { status: 500 }
        );
    }
}

// PATCH - обновить проект
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // Только менеджеры могут обновлять проекты
        if (session.user.role !== 'MANAGER') {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Название проекта обязательно" },
                { status: 400 }
            );
        }

        const project = await prisma.project.update({
            where: { id: params.id },
            data: {
                name: name.trim(),
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Ошибка при обновлении проекта" },
            { status: 500 }
        );
    }
}

// DELETE - удалить проект
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // Только менеджеры могут удалять проекты
        if (session.user.role !== 'MANAGER') {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        // Проверяем, есть ли связанные объекты строительства
        const projectWithSites = await prisma.project.findUnique({
            where: { id: params.id },
            include: { sites: true }
        });

        if (projectWithSites && projectWithSites.sites.length > 0) {
            return NextResponse.json(
                { error: "Нельзя удалить проект с привязанными объектами" },
                { status: 400 }
            );
        }

        await prisma.project.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Проект удален" });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Ошибка при удалении проекта" },
            { status: 500 }
        );
    }
}