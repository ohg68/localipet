import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Users,
    PawPrint,
    Hospital,
    TrendingUp,
    Settings,
    LayoutDashboard,
    BellRing,
    ShoppingBag
} from "lucide-react";

import VetNavigation from "@/components/VetNavigation";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function VetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect("/");

    // 1. Get all organizations where the user is a member
    const userMemberships = await prisma.organizationMember.findMany({
        where: { userId: session.user.id },
        include: { organization: true }
    });

    if (userMemberships.length === 0 && session.user.role !== "ADMIN") {
        redirect("/");
    }

    const locale = await getLocale();
    const t = translations[locale];

    // Default to first membership if none specified in a way we can track (for layouts, pages handle it better)
    const activeOrg = userMemberships[0]?.organization;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Vet Header */}
            <div className="bg-white border-b border-gray-100 py-6 sticky top-0 z-30 shadow-sm">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-2xl">
                            <Hospital className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-gray-900 italic tracking-tight">
                                    Localipet <span className="text-primary truncate max-w-[150px] inline-block align-bottom">{activeOrg?.name || "Vet ERP"}</span>
                                </h1>
                                {userMemberships.length > 1 && (
                                    <span className="bg-gray-100 text-gray-400 p-1.5 rounded-lg">
                                        <Settings className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.vet.panelSubtitle}</p>
                        </div>
                    </div>

                    <VetNavigation locale={locale} />
                </div>
            </div>

            <div className="container py-12">
                {children}
            </div>
        </div>
    );
}
