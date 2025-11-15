import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SERVICES = {
    users: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
};

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleRequest(request, params);
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleRequest(request, params);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleRequest(request, params);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleRequest(request, params);
}

async function handleRequest(
    request: NextRequest,
    { path }: { path: string[] }
) {
    const service = path[0];
    const route = path.slice(1).join('/');

    // Логирование входящего запроса
    console.log(`[API Gateway] ${request.method} /${path.join('/')}`);

    // Проверка JWT для защищенных путей
    if (!isPublicRoute(path)) {
        const token = await getToken({ req: request });
        if (!token) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется аутентификация' } },
                { status: 401 }
            );
        }
    }

    // Проксирование запроса
    try {
        const targetUrl = `${SERVICES[service as keyof typeof SERVICES]}/${route}`;
        const headers = new Headers();

        // Копируем заголовки
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        // Добавляем X-Request-ID для трассировки
        const requestId = crypto.randomUUID();
        headers.set('X-Request-ID', requestId);

        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: request.body,
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'X-Request-ID': requestId,
            },
        });
    } catch (error) {
        console.error(`[API Gateway Error] ${error}`);
        return NextResponse.json(
            { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Сервис временно недоступен' } },
            { status: 503 }
        );
    }
}

function isPublicRoute(path: string[]): boolean {
    const publicRoutes = [
        ['users', 'register'],
        ['users', 'login'],
        ['health'],
    ];

    return publicRoutes.some(route =>
        route.length === path.length &&
        route.every((segment, i) => segment === path[i])
    );
}