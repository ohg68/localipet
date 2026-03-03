import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import CreateAnimalForm from "@/components/CreateAnimalForm";

export default async function CreateAnimalPage({
    searchParams
}: {
    searchParams: Promise<{ qrToken?: string }>
}) {
    const { qrToken } = await searchParams;
    const locale = await getLocale();
    const t = translations[locale];

    return (
        <div className="container max-w-2xl pb-12">
            <Link href="/animals" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-8 transition-colors font-black uppercase tracking-widest text-xs">
                <ArrowLeft className="w-4 h-4" />
                <span>{t.animalForm.back}</span>
            </Link>

            <div className="card p-10 shadow-2xl">
                <h1 className="text-3xl font-black text-gray-900 mb-8 italic uppercase tracking-tight">{t.animalForm.title}</h1>
                <Suspense fallback={<div className="p-8 text-center text-gray-400 font-bold italic">{t.animalForm.loading}</div>}>
                    <CreateAnimalForm initialToken={qrToken || ""} locale={locale} />
                </Suspense>
            </div>
        </div>
    );
}
