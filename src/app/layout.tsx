import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "СистемаКонтроля - Управление дефектами",
    description: "Система управления дефектами на строительных объектах",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
        <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        </body>
        </html>
    );
}