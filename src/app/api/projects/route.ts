import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить все проекты
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            include: {
                sites: {
                    include: {
                        _count: {
                            select: { defects: true }
                        }
                    }
                },
                _count: {
                    select: { sites: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Ошибка при загрузке проектов" },
            { status: 500 }
        );
    }
}

// POST - создать новый проект
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
        }

        // Только менеджеры могут создавать проекты
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

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Ошибка при создании проекта" },
            { status: 500 }
        );
    }
}