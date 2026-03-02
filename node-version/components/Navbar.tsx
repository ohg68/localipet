import Link from "next/link";
import { HeartPulse, Home, List, Hospital, LogIn, UserPlus, MessageSquare, AlertCircle, ShieldCheck, Heart } from "lucide-react";
import { auth } from "@/auth";
import UserMenu from "@/components/UserMenu";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Navbar() {
    const session = await auth();
    const locale = await getLocale();
    const t = translations[locale];

    let unreadCount = 0;
    let currentUserRole = session?.user?.role;
    let hasOrgMembership = false;

    if (session?.user?.id) {
        unreadCount = await prisma.finderMessage.count({
            where: {
                qrCode: { animal: { ownerId: session.user.id } },
                isRead: false
            }
        });

        const [profile, orgMember] = await Promise.all([
            prisma.profile.findUnique({ where: { userId: session.user.id } }),
            prisma.organizationMember.findFirst({ where: { userId: session.user.id } })
        ]);

        if (profile) currentUserRole = profile.role;
        hasOrgMembership = !!orgMember;
    }

    return (
        <nav className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-white/5">
            <div className="container py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group transition-all">
                    <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black italic tracking-tighter hidden sm:block">Localipet</span>
                </Link>

                <div className="hidden lg:flex items-center gap-8">
                    <Link href="/lost-pets" className="flex items-center gap-2 hover:text-rose-400 transition-colors text-[10px] font-black uppercase tracking-widest text-rose-300 italic group">
                        <AlertCircle className="w-4 h-4 group-hover:animate-pulse" />
                        <span>{t.nav.lostPets}</span>
                    </Link>
                    <Link href="/about" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest group">
                        <HeartPulse className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{t.nav.howItWorks}</span>
                    </Link>
                    {session ? (
                        <>
                            <div className="h-4 w-px bg-white/10 mx-2"></div>
                            <Link href="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest group">
                                <Home className="w-4 h-4" />
                                <span>{t.nav.home}</span>
                            </Link>
                            <Link href="/animals" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest group">
                                <List className="w-4 h-4" />
                                <span>{t.nav.pets}</span>
                            </Link>
                            <Link href="/messages" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest relative group">
                                <MessageSquare className="w-4 h-4" />
                                <span>{t.nav.notifications}</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/vet" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest group">
                                <Hospital className="w-4 h-4" />
                                <span>{t.nav.clinics}</span>
                            </Link>
                            {currentUserRole === "ADMIN" && (
                                <Link href="/admin" className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors text-[10px] font-black uppercase tracking-widest group">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{t.nav.admin}</span>
                                </Link>
                            )}
                        </>
                    ) : null}
                </div>

                <div className="flex items-center gap-6">
                    <LanguageSwitcher currentLocale={locale} />
                    {session ? (
                        <UserMenu user={session.user} />
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">{t.nav.login}</span>
                            </Link>
                            <Link href="/register" className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest border-b-2 border-green-700">
                                <UserPlus className="w-4 h-4" />
                                <span>{t.nav.register}</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
