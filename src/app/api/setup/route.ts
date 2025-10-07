import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        // Проверяем, есть ли уже пользователи
        const userCount = await prisma.user.count();

        if (userCount === 0) {
            // Создаем администратора по умолчанию
            const hashedPassword = await bcrypt.hash("admin123", 10);

            await prisma.user.create({
                data: {
                    email: "admin@system.ru",
                    name: "Администратор",
                    password: hashedPassword,
                    role: "MANAGER",
                },
            });

            return NextResponse.json({
                message: "Создан пользователь по умолчанию: admin@system.ru / admin123"
            });
        }

        return NextResponse.json({ message: "Система уже настроена" });
    } catch (error) {
        return NextResponse.json(
            { error: "Ошибка настройки" },
            { status: 500 }
        );
    }
}