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

        // Buscar ofertas globales actives
        const globalOffers = await prisma.globalOffer.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        // En un futuro: Buscar campañas de la organización (clínica) asociada al perfil del usuario
        // Por ahora traemos cualquier campaña activa como placeholder
        const clinicOffers = await prisma.vetCampaign.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(
            {
                globalOffers,
                clinicOffers
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mobile Offers GET Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
