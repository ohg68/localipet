"use server";

import { cookies } from "next/headers";
import { Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value as Locale;
    return locale || "es";
}

export async function setLocale(locale: Locale) {
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, { path: "/" });
}
