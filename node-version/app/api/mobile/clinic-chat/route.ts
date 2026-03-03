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

        // Buscar una sesión de chat abierta entre el usuario y su clínica asignada
        // Como un usuario puede tener N animales que van a N clínicas, se debería filtrar, 
        // pero para este MVP tomaremos la primera organización de sus animales.

        // Simplificación para la v1: ver si tiene un ClinicChatSession
        let session = await prisma.clinicChatSession.findFirst({
            where: { userId },
            include: {
                organization: true,
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!session) {
            // Como fallback de prueba, le asignamos la primera clínica al azar
            const org = await prisma.organization.findFirst({
                where: { type: 'CLINIC' }
            });

            if (org) {
                session = await prisma.clinicChatSession.create({
                    data: {
                        userId,
                        organizationId: org.id
                    },
                    include: {
                        organization: true,
                        messages: true
                    }
                });
            }
        }

        return NextResponse.json(
            {
                session
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mobile Chat GET Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const decodedToken = await getUserFromHeader(request);
        if (!decodedToken) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = decodedToken.id;
        const { sessionId, content, imageUrl } = await request.json();

        if (!sessionId || (!content && !imageUrl)) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
        }

        // Validar propiedad de la sesión
        const session = await prisma.clinicChatSession.findUnique({
            where: { id: sessionId }
        });

        if (!session || session.userId !== userId) {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        const message = await prisma.clinicChatMessage.create({
            data: {
                sessionId,
                content: content || (imageUrl ? '📷 Imagen' : ''),
                imageUrl,
                senderType: 'USER' // Desde la app manda el usuario
            }
        });

        await prisma.clinicChatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        });

        // Here we could proactively push to the VET dashboard if they had web pushes,
        // but for now, they poll every 5s.

        return NextResponse.json(
            { message },
            { status: 201 }
        );
    } catch (error) {
        console.error('Mobile Chat POST Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
