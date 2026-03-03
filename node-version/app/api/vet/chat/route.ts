import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) return NextResponse.json({ error: 'Falta orgId' }, { status: 400 });

        // Verificamos pertenencia
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id, organizationId: orgId }
        });

        if (!membership && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        const chatSessions = await prisma.clinicChatSession.findMany({
            where: { organizationId: orgId },
            include: {
                user: true,
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ sessions: chatSessions }, { status: 200 });

    } catch (error) {
        console.error('Vet Chat GET Error:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const sessionAuth = await auth();
        if (!sessionAuth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await request.json();
        const { sessionId, content } = body;

        const chatSession = await prisma.clinicChatSession.findUnique({
            where: { id: sessionId }
        });

        if (!chatSession) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });

        // Verificar que pertenece a la organización
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: sessionAuth.user.id, organizationId: chatSession.organizationId }
        });

        if (!membership && sessionAuth.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        const msg = await prisma.clinicChatMessage.create({
            data: {
                sessionId,
                content,
                senderType: 'CLINIC'
            }
        });

        // Actualizar el "updatedAt" de la sesión para reordenar arriba
        await prisma.clinicChatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        });

        // Get the related User's push token to send the notification
        const userProfile = await prisma.profile.findUnique({
            where: { userId: chatSession.userId }
        });

        if (userProfile?.pushToken) {
            const { sendNotification } = await import('@/lib/notifications');
            await sendNotification({
                to: userProfile.pushToken,
                type: 'expo',
                title: 'Nuevo Mensaje de la Clínica',
                message: content,
                data: { route: 'clinic-chat' }
            });
        }

        return NextResponse.json({ message: msg }, { status: 201 });
    } catch (error) {
        console.error('Vet Chat POST Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
