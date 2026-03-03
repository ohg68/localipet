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
        return decoded.id;
    } catch (error) {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserFromHeader(req);
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { pushToken } = body;

        if (!pushToken) {
            return NextResponse.json({ error: 'Falta el pushToken' }, { status: 400 });
        }

        // Update the user's profile with the new pushToken
        await prisma.profile.upsert({
            where: { userId },
            update: { pushToken },
            create: {
                userId,
                pushToken,
                role: 'OWNER' // default role fallback
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error saving push token:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
