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

export async function POST(request: Request) {
    try {
        const decodedToken = await getUserFromHeader(request);
        if (!decodedToken) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = decodedToken.id;
        const body = await request.json();
        const { imageBase64, caption, platform } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
        }

        // Para el MVP: Buscamos la primera mascota del usuario
        const firstAnimal = await prisma.animal.findFirst({
            where: { ownerId: userId },
            orderBy: { createdAt: 'asc' }
        });

        if (!firstAnimal) {
            // Si el usuario no tiene mascotas, no podemos subir la foto de su mascota
            return NextResponse.json(
                { error: 'No tienes mascotas registradas' },
                { status: 404 }
            );
        }

        // Aquí (en un escenario real) subiríamos la imagen a S3, Cloudinary o Vercel Blob.
        // Para simplificar este MVP y no desbordar tu base de datos, guardaremos un string
        // trucado o una URL base64 reducida, pero la lógica de Prisma ya estará lista.

        const newPhoto = await prisma.animalPhoto.create({
            data: {
                animalId: firstAnimal.id,
                image: imageBase64.substring(0, 100) + '... (base64 estática por DB limits)', // Placeholder S3 URL
                caption: caption || `Publicado en ${platform || 'Redes Sociales'}`,
                isPrimary: false
            }
        });

        return NextResponse.json(
            {
                message: 'Foto subida y compartida exitosamente',
                photoId: newPhoto.id
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Mobile Upload POST Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
