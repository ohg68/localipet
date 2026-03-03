import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Aquí usamos AUTH_SECRET de next-auth como semilla
        const secret = process.env.AUTH_SECRET || 'fallback-secret-for-dev';

        // Creamos el token (válido por 30 días, normal para apps móviles)
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.profile?.role || 'USER',
                profileId: user.profile?.id,
            },
            secret,
            { expiresIn: '30d' }
        );

        return NextResponse.json(
            {
                token,
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: user.profile?.role,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mobile Login Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
