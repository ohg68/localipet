"use client";

import { useEffect, useState } from "react";
import { Locale, translations } from "@/lib/i18n";

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
}

export function useTranslations() {
    const [locale, setLocale] = useState<Locale>("es");

    useEffect(() => {
        const savedLocale = getCookie("NEXT_LOCALE") as Locale;
        if (savedLocale && (savedLocale === "es" || savedLocale === "pt")) {
            setLocale(savedLocale);
        }
    }, []);

    return { t: translations[locale], locale };
}
