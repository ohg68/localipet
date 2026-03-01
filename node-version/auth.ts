import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: { profile: true }
                    });
                    if (!user || !user.password || !user.profile) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            email: user.email,
                            name: `${user.firstName} ${user.lastName}`,
                            role: user.profile.role,
                            profileId: user.profile.id,
                        };
                    }
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as string;
                session.user.profileId = token.profileId as string;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user && user.id) {
                token.id = user.id;
                // Fetch profile to get role
                const profile = await prisma.profile.findUnique({
                    where: { userId: user.id }
                });
                if (profile) {
                    token.role = profile.role;
                    token.profileId = profile.id;
                }
            }
            return token;
        },
    },
});
