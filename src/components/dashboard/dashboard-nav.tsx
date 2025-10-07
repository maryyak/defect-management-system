"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface DashboardNavProps {
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
    };
}

function NavLink({ href, label }: { href: string; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
            }`}
        >
            {label}
        </Link>
    );
}

export default function DashboardNav({ user }: DashboardNavProps) {
    return (
        <nav className="w-64 bg-white shadow-lg">
            <div className="p-6">
                <h1 className="text-xl font-bold text-gray-800">СистемаКонтроля</h1>
                <p className="text-sm text-gray-600 mt-2">
                    {user.name || user.email} ({user.role})
                </p>
            </div>

            <div className="mt-6">
                <nav className="space-y-2 px-4">
                    <NavLink href="/dashboard" label="Обзор"/>
                    <NavLink href="/dashboard/projects" label="Проекты"/>
                    <NavLink href="/dashboard/defects" label="Дефекты"/>
                    <NavLink href="/dashboard/reports" label="Отчеты"/>
                </nav>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                >
                    Выйти
                </button>
            </div>
        </nav>
    );
}