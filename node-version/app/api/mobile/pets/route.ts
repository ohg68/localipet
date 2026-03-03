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

        // Fetch all pets belonging to the user
        const rawPets = await prisma.animal.findMany({
            where: {
                ownerId: userId
            },
            include: {
                photos: {
                    where: { isPrimary: true },
                    take: 1
                },
                appointments: {
                    orderBy: { date: 'desc' },
                    take: 2 // Fetch latest appointments as a substitute for medical records
                },
                vaccinations: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const pets = rawPets.map(pet => ({
            ...pet,
            AnimalPhoto: pet.photos,
            MedicalRecord: pet.appointments,
            Vaccine: pet.vaccinations
        }));

        return NextResponse.json({ pets }, { status: 200 });

    } catch (error) {
        console.error('Mobile Pets GET Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al obtener mascotas' },
            { status: 500 }
        );
    }
}
