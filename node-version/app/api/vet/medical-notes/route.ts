import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const animalId = searchParams.get('animalId');
        const orgId = searchParams.get('orgId');

        if (!animalId || !orgId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

        // Verificamos pertenencia
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id, organizationId: orgId }
        });

        if (!membership && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        const notes = await prisma.medicalNote.findMany({
            where: { animalId, organizationId: orgId },
            include: {
                vet: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ notes }, { status: 200 });

    } catch (error) {
        console.error('Medical Notes GET Error:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await request.json();
        const { animalId, orgId, title, content, type } = body;

        // Verificar que pertenece a la organización
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id, organizationId: orgId }
        });

        if (!membership && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        }

        const note = await prisma.medicalNote.create({
            data: {
                animalId,
                organizationId: orgId,
                vetId: session.user.id,
                title,
                content,
                type: type || 'GENERAL'
            }
        });

        // Al crear una nota médica, podríamos notificar al usuario, 
        // pero por ahora lo mantenemos simple.
        const userProfile = await prisma.profile.findFirst({
            where: { user: { animals: { some: { id: animalId } } } }
        });

        if (userProfile?.pushToken) {
            const { sendNotification } = await import('@/lib/notifications');
            await sendNotification({
                to: userProfile.pushToken,
                type: 'expo',
                title: 'Nueva Nota Médica',
                message: `La clínica ha añadido una nueva actualización en el historial de tu mascota.`,
                data: { animalId }
            });
        }

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        console.error('Medical Notes POST Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
