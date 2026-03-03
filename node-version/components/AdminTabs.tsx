"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, PawPrint, Hospital, QrCode, LayoutDashboard } from "lucide-react";
import { translations, Locale } from "@/lib/i18n";

export default function AdminTabs({ locale }: { locale: Locale }) {
    const pathname = usePathname();
    const t = translations[locale];

    const tabs = [
        { name: t.admin.tabs.summary, href: "/admin", icon: LayoutDashboard },
        { name: t.admin.tabs.users, href: "/admin/users", icon: Users },
        { name: t.admin.tabs.pets, href: "/admin/animals", icon: PawPrint },
        { name: t.admin.tabs.clinics, href: "/admin/vets", icon: Hospital },
        { name: t.admin.tabs.batches, href: "/admin/qr-generator", icon: QrCode },
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
