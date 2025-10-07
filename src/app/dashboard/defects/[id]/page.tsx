import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DefectDetail from "@/components/defects/defect-detail";

interface DefectDetailPageProps {
    params: {
        id: string;
    };
}

export default async function DefectDetailPage({ params }: DefectDetailPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return <div>Не авторизован</div>;
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
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Дефект не найден</div>
                <Link
                    href="/dashboard/defects"
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                    ← Вернуться к дефектам
                </Link>
            </div>
        );
    }

    return (
        <DefectDetail defect={defect} session={session} />
    );
}