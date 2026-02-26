"use client";

import { useState } from "react";
import { createAnimal } from "@/app/actions/animals";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CreateAnimalPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            await createAnimal(formData);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear la mascota");
            setLoading(false);
        }
    }

    return (
        <div className="container max-w-2xl">
            <Link href="/animals" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al listado</span>
            </Link>

            <div className="card p-8">
                <h1 className="text-2xl font-bold mb-6">Registrar Nueva Mascota</h1>

                <form action={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota</label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Max, Luna..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                            <select
                                name="species"
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="DOG">Perro</option>
                                <option value="CAT">Gato</option>
                                <option value="BIRD">Ave</option>
                                <option value="RABBIT">Conejo</option>
                                <option value="REPTILE">Reptil</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Raza (Opcional)</label>
                            <input
                                name="breed"
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Golden Retriever"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID del Microchip (Opcional)</label>
                            <input
                                name="microchipId"
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Número de 15 dígitos"
                            />
                        </div>

                        <div className="md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <label className="block text-sm font-bold text-primary mb-1">¿Ya tienes un Tag físico?</label>
                            <p className="text-xs text-gray-500 mb-3">Si compraste un collar o tag de Localipet, ingresa el código de 10 caracteres que viene impreso.</p>
                            <input
                                name="qrToken"
                                type="text"
                                className="w-full border-2 border-primary/20 rounded-md px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono font-bold"
                                placeholder="Ej: ABC123XYZ0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary justify-center py-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Mascota"}
                        </button>
                        <Link href="/animals" className="flex-1 border border-gray-300 text-gray-600 px-4 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors text-center">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
