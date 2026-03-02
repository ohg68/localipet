"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    PawPrint,
    BellRing,
    ShoppingBag
} from "lucide-react";

export default function VetNavigation() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("orgId");

    const tabs = [
        { name: "Resumen", href: "/vet", icon: LayoutDashboard },
        { name: "Clientes CRM", href: "/vet/clients", icon: Users },
        { name: "Mascotas", href: "/vet/animals", icon: PawPrint },
        { name: "Alertas & Campañas", href: "/vet/communications", icon: BellRing },
        { name: "Ventas/Pedidos", href: "/vet/inventory", icon: ShoppingBag },
    ];

    return (
        <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto max-w-full">
            {tabs.map((tab) => {
                const fullHref = orgId ? `${tab.href}?orgId=${orgId}` : tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={fullHref}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all text-gray-400 hover:text-gray-900 hover:bg-white active:scale-95 whitespace-nowrap"
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
