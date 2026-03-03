import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || 'fallback-secret-for-dev';

export async function POST(req: Request) {
    try {
        const { provider, token } = await req.json();

        if (!provider || !token) {
            return NextResponse.json(
                { error: 'Proveedor y token de acceso son obligatorios' },
                { status: 400 }
            );
        }

        let userEmail, userFirstName, userLastName, userPicture;

        if (provider === 'google') {
            // Validate Google Token using Google's API
            const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!googleResponse.ok) {
                return NextResponse.json({ error: 'Token de Google inválido' }, { status: 401 });
            }

            const googleUser = await googleResponse.json();
            userEmail = googleUser.email;
            userFirstName = googleUser.given_name || 'Usuario';
            userLastName = googleUser.family_name || '';
            userPicture = googleUser.picture || null;

            if (!userEmail) {
                return NextResponse.json({ error: 'No se pudo obtener el email de Google' }, { status: 400 });
            }

        } else if (provider === 'apple') {
            // The token is an Apple Identity Token (JWT). We decode it to get the email.
            const decoded = jwt.decode(token);
            if (!decoded || typeof decoded === 'string' || !decoded.email) {
                return NextResponse.json({ error: 'Token de Apple inválido' }, { status: 401 });
            }

            userEmail = decoded.email;
            // Apple only provides name on the FIRST ever login in a separate field, not in the token.
            // If the client passed full name info in the body, we could use that. Fallback to generic:
            const body = await req.json().catch(() => ({})); // Parse body again for additional fields if needed
            userFirstName = body.firstName || 'Usuario';
            userLastName = body.lastName || 'Apple';
            userPicture = null;

        } else {
            return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
        }

        // Find or Create User in DB
        let user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            // Determine user role based on email, defaulting to OWNER
            const role = userEmail.endsWith('@localipet.com') ? 'ADMIN' : 'OWNER';

            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    firstName: userFirstName,
                    lastName: userLastName,
                    password: '', // No password for social logins initially
                    profile: {
                        create: {
                            role: role,
                            avatar: userPicture,
                        }
                    }
                }
            });
        } else {
            // Update avatar if we don't have one
            const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
            if (profile && !profile.avatar && userPicture) {
                await prisma.profile.update({
                    where: { userId: user.id },
                    data: { avatar: userPicture }
                });
            }
        }

        // Generate JWT
        const appToken = jwt.sign(
            { id: user.id, email: user.email, role: 'OWNER' }, // Assuming OWNER for mobile app
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            message: 'Login exitoso',
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Mobile Social Login Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor. Intenta de nuevo más tarde.' },
            { status: 500 }
        );
    }
}
