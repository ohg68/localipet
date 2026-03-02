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

export default async function VetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) redirect("/");

    // 1. Double check actual role/membership in DB to avoid session lag
    const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId: session.user.id }
    });

    const isAuthorized = session.user.role === "VET" || session.user.role === "ADMIN" || !!orgMembership;

    if (!isAuthorized) {
        redirect("/");
    }

    const tabs = [
        { name: "Resumen", href: "/vet", icon: LayoutDashboard },
        { name: "Clientes CRM", href: "/vet/clients", icon: Users },
        { name: "Mascotas", href: "/vet/animals", icon: PawPrint },
        { name: "Alertas & Campañas", href: "/vet/communications", icon: BellRing },
        { name: "Ventas/Pedidos", href: "/vet/inventory", icon: ShoppingBag },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Vet Header */}
            <div className="bg-white border-b border-gray-100 py-6 sticky top-0 z-30 shadow-sm">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-2xl">
                            <Hospital className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 italic tracking-tight">Vet <span className="text-primary">Connect</span> ERP</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inteligencia Clínica para Localipet</p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all text-gray-400 hover:text-gray-900 hover:bg-white active:scale-95"
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden lg:inline">{tab.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="container py-12">
                {children}
            </div>
        </div>
    );
}
