"use client";

import { useState } from "react";
import { createAnimal } from "@/app/actions/animals";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Locale, translations } from "@/lib/i18n";

export default function CreateAnimalForm({
    initialToken,
    locale
}: {
    initialToken: string;
    locale: Locale;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = translations[locale];

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            await createAnimal(formData);
        } catch (err: any) {
            setError(err.message || t.animalForm.errorMsg);
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.animalForm.nameLabel}</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder={t.animalForm.namePlaceholder}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.animalForm.speciesLabel}</label>
                    <select
                        name="species"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
                    >
                        <option value="DOG">{t.animalForm.speciesOptions.DOG}</option>
                        <option value="CAT">{t.animalForm.speciesOptions.CAT}</option>
                        <option value="BIRD">{t.animalForm.speciesOptions.BIRD}</option>
                        <option value="RABBIT">{t.animalForm.speciesOptions.RABBIT}</option>
                        <option value="REPTILE">{t.animalForm.speciesOptions.REPTILE}</option>
                        <option value="OTHER">{t.animalForm.speciesOptions.OTHER}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.animalForm.breedLabel}</label>
                    <input
                        name="breed"
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder={t.animalForm.breedPlaceholder}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.animalForm.microchipLabel}</label>
                    <input
                        name="microchipId"
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder={t.animalForm.microchipPlaceholder}
                    />
                </div>

                <div className="md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <label className="block text-sm font-bold text-primary mb-1">{t.animalForm.tagQuestion}</label>
                    <p className="text-xs text-gray-500 mb-3">{t.animalForm.tagDesc}</p>
                    <input
                        name="qrToken"
                        type="text"
                        defaultValue={initialToken}
                        className="w-full border-2 border-primary/20 rounded-md px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono font-bold"
                        placeholder={t.animalForm.tagPlaceholder}
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary justify-center py-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.animalForm.submitSave}
                </button>
                <Link href="/animals" className="flex-1 border border-gray-300 text-gray-600 px-4 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors text-center">
                    {t.animalForm.cancel}
                </Link>
            </div>
        </form>
    );
}
