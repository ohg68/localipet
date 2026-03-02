"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, PawPrint, Hospital, QrCode, LayoutDashboard } from "lucide-react";

export default function AdminTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: "Resumen", href: "/admin", icon: LayoutDashboard },
        { name: "Usuarios", href: "/admin/users", icon: Users },
        { name: "Mascotas", href: "/admin/animals", icon: PawPrint },
        { name: "Clínicas/Vets", href: "/admin/vets", icon: Hospital },
        { name: "Lotes QR", href: "/admin/qr-generator", icon: QrCode },
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-2xl w-fit">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${isActive
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
