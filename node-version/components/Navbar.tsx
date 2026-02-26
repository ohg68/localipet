import Link from "next/link";
import { HeartPulse, Home, List, Hospital, LogIn, UserPlus, MessageSquare, AlertCircle, QrCode } from "lucide-react";
import { auth } from "@/auth";
import UserMenu from "@/components/UserMenu";
import { prisma } from "@/lib/prisma";

export default async function Navbar() {
    const session = await auth();

    let unreadCount = 0;
    if (session?.user?.id) {
        unreadCount = await prisma.finderMessage.count({
            where: {
                qrCode: { animal: { ownerId: session.user.id } },
                isRead: false
            }
        });
    }

    return (
        <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
            <div className="container py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-black italic tracking-tighter">
                    <HeartPulse className="w-6 h-6" />
                    <span>Localipet</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/lost-pets" className="flex items-center gap-1.5 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-wider text-rose-200">
                        <AlertCircle className="w-4 h-4" />
                        <span>Mascotas Perdidas</span>
                    </Link>
                    {session ? (
                        <>
                            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-wider">
                                <Home className="w-4 h-4" />
                                <span>Inicio</span>
                            </Link>
                            <Link href="/animals" className="flex items-center gap-1.5 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-wider">
                                <List className="w-4 h-4" />
                                <span>Mascotas</span>
                            </Link>
                            <Link href="/messages" className="flex items-center gap-1.5 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-wider relative">
                                <MessageSquare className="w-4 h-4" />
                                <span>Avisos</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-primary animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/vet" className="flex items-center gap-1.5 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-wider">
                                <Hospital className="w-4 h-4" />
                                <span>Clínicas</span>
                            </Link>
                            {session.user.role === "ADMIN" && (
                                <Link href="/admin/qr-generator" className="flex items-center gap-1.5 text-rose-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                                    <QrCode className="w-4 h-4" />
                                    <span>Constructor</span>
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="flex items-center gap-1 hover:text-white/80 transition-colors text-sm font-medium">
                                <LogIn className="w-4 h-4" />
                                <span>Entrar</span>
                            </Link>
                            <Link href="/register" className="flex items-center gap-1 hover:text-white/80 transition-colors text-sm font-medium">
                                <UserPlus className="w-4 h-4" />
                                <span>Registrarse</span>
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4 text-white">
                    {session ? (
                        <UserMenu user={session.user} />
                    ) : (
                        <Link href="/login" className="md:hidden">
                            <LogIn className="w-5 h-5 transition-colors hover:text-white/80" />
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
