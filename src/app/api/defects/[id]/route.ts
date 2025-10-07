import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить дефект по ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { id } = await params;

        const defect = await prisma.defect.findUnique({
            where: { id },
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
                comments: {
                    include: {
                        author: {
                            select: { name: true, email: true }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                attachments: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!defect) {
            return NextResponse.json({ error: "Дефект не найден" }, { status: 404 });
        }

        return NextResponse.json(defect);
    } catch (error) {
        console.error("Error fetching defect:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке дефекта" },
            { status: 500 }
        );
    }
}

// PATCH - обновить дефект
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { id } = await params;

        // Проверяем, существует ли дефект
        const existingDefect = await prisma.defect.findUnique({
            where: { id }
        });

        if (!existingDefect) {
            return NextResponse.json({ error: "Дефект не найден" }, { status: 404 });
        }

        // Только менеджеры, инженеры или назначенный исполнитель могут обновлять дефект
        const canUpdate =
            session.user.role === 'MANAGER' ||
            session.user.role === 'ENGINEER' ||
            existingDefect.assigneeId === session.user.id;

        if (!canUpdate) {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        const { title, description, status, priority, assigneeId, deadline } = await request.json();

        const defect = await prisma.defect.update({
            where: { id },
            data: {
                ...(title && { title: title.trim() }),
                ...(description !== undefined && { description: description?.trim() }),
                ...(status && { status }),
                ...(priority && { priority }),
                ...(assigneeId !== undefined && { assigneeId }),
                ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
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
        console.error("Error updating defect:", error);
        return NextResponse.json(
            { error: "Ошибка при обновлении дефекта" },
            { status: 500 }
        );
    }
}

// DELETE - удалить дефект
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { id } = await params;

        // Проверяем, существует ли дефект
        const existingDefect = await prisma.defect.findUnique({
            where: { id }
        });

        if (!existingDefect) {
            return NextResponse.json({ error: "Дефект не найден" }, { status: 404 });
        }

        // Только менеджеры и инженеры могут удалять дефекты
        if (!['MANAGER', 'ENGINEER'].includes(session.user.role)) {
            return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
        }

        await prisma.defect.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Дефект удален" });
    } catch (error) {
        console.error("Error deleting defect:", error);
        return NextResponse.json(
            { error: "Ошибка при удалении дефекта" },
            { status: 500 }
        );
    }
}