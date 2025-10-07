import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить комментарии дефекта
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

        const comments = await prisma.comment.findMany({
            where: { defectId: id },
            include: {
                author: {
                    select: { name: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке комментариев" },
            { status: 500 }
        );
    }
}

// POST - добавить комментарий
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Содержание комментария обязательно" },
                { status: 400 }
            );
        }

        // Проверяем существование дефекта
        const defect = await prisma.defect.findUnique({
            where: { id }
        });

        if (!defect) {
            return NextResponse.json({ error: "Дефект не найден" }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                defectId: id,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Ошибка при создании комментария" },
            { status: 500 }
        );
    }
}