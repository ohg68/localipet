import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Función para extraer el ID de usuario desde el token JWT del móvil
async function getUserFromHeader(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const secret = process.env.AUTH_SECRET || 'fallback-secret-for-dev';

    try {
        const decoded = jwt.verify(token, secret) as any;
        return decoded.id; // Retorna el User ID
    } catch (error) {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const userId = await getUserFromHeader(request);

        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Traer datos del usuario y sus animales
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: {
                    select: { role: true }
                },
                animals: {
                    select: { id: true, name: true, photo: true, species: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Calcular estadísticas (esto es un dato simulado para escaneos, pero real para cantidad de animales)
        const animals = user.animals || [];

        // Opcional: Podrías buscar también los escaneos recientes en base a los QRCode vinculados a sus animales, 
        // pero para la V1 del dashboard mantendremos algo simple.
        const stats = {
            pets: animals.length,
            scans: 0, // Placeholder
        };

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.profile?.role
                },
                animals,
                stats
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mobile Dashboard Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
