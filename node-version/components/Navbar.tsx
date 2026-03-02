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
        <nav className="bg-white text-slate-900 shadow-sm sticky top-0 z-50 border-b border-slate-100">
            <div className="container py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-1 group transition-all">
                    <span className="text-2xl font-black tracking-tight text-primary">Locali</span>
                    <div className="bg-secondary w-7 h-8 rounded-t-full rounded-bl-full flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                        <div className="bg-white w-2 h-2 rounded-full mb-1"></div>
                    </div>
                    <span className="text-2xl font-black tracking-tight text-primary ml-0.5">et</span>
                </Link>

                <div className="hidden lg:flex items-center gap-8">
                    <Link href="/lost-pets" className="flex items-center gap-2 hover:text-secondary transition-colors text-xs font-bold uppercase tracking-wider text-rose-500 group">
                        <AlertCircle className="w-4 h-4 group-hover:animate-pulse" />
                        <span>{t.nav.lostPets}</span>
                    </Link>
                    <Link href="/about" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600 group">
                        <HeartPulse className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{t.nav.howItWorks}</span>
                    </Link>
                    {session ? (
                        <>
                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                            <Link href="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600 group">
                                <Home className="w-4 h-4" />
                                <span>{t.nav.home}</span>
                            </Link>
                            <Link href="/animals" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600 group">
                                <List className="w-4 h-4" />
                                <span>{t.nav.pets}</span>
                            </Link>
                            <Link href="/messages" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600 relative group">
                                <MessageSquare className="w-4 h-4" />
                                <span>{t.nav.notifications}</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-secondary text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white animate-bounce font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/vet" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600 group">
                                <Hospital className="w-4 h-4" />
                                <span>{t.nav.clinics}</span>
                            </Link>
                            {currentUserRole === "ADMIN" && (
                                <Link href="/admin" className="flex items-center gap-2 text-secondary hover:text-secondary-hover transition-colors text-xs font-bold uppercase tracking-wider group">
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
                        <div className="border border-slate-100 rounded-full p-0.5">
                            <UserMenu user={session.user} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-600">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">{t.nav.login}</span>
                            </Link>
                            <Link href="/register" className="hidden sm:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary-hover active:scale-95 transition-all text-xs font-bold uppercase tracking-wider shadow-sm">
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
