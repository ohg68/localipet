import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function getUserFromHeader(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const secret = process.env.AUTH_SECRET || 'fallback-secret-for-dev';

    try {
        const decoded = jwt.verify(token, secret) as any;
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const decodedToken = await getUserFromHeader(request);
        if (!decodedToken) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = decodedToken.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                profile: {
                    select: {
                        role: true,
                        avatar: true,
                        phone: true,
                        city: true,
                        country: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.error('Mobile Profile GET Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
