"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/locale";
import { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const toggleLocale = () => {
        const nextLocale: Locale = currentLocale === "es" ? "pt" : "es";
        startTransition(async () => {
            await setLocale(nextLocale);
            router.refresh();
        });
    };

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-400 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
        >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{currentLocale === "es" ? "ES" : "PT"}</span>
        </button>
    );
}
