"use client";

import { useState } from "react";
import { Search, Loader2, Hash, AlertCircle } from "lucide-react";
import { lookupShortCode } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Locale, translations } from "@/lib/i18n";

export default function ShortCodeSearch({ locale }: { locale: Locale }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const t = translations[locale];

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 3) return;

        setLoading(true);
        setError(null);

        try {
            const token = await lookupShortCode(code);
            router.push(`/s/${token}`);
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage === "Código no encontrado.") {
                errorMessage = t.scanHelp.error;
            } else if (errorMessage === "El código debe tener entre 5 y 10 caracteres.") {
                errorMessage = t.scanHelp.invalidLength;
            } else {
                errorMessage = t.scanHelp.error;
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="card p-8 bg-white shadow-xl border-2 border-gray-100 mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                {t.scanHelp.title}
            </h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">
                {t.scanHelp.description}
            </p>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">#</div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder={t.scanHelp.placeholder}
                        maxLength={7}
                        className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-primary outline-none transition-all font-mono font-black text-lg tracking-widest"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !code}
                    className="btn-primary px-8 py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Search className="w-6 h-6" /> {t.scanHelp.button}</>}
                </button>
            </form>

            {error && (
                <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
