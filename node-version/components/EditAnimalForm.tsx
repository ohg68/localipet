"use client";

import { useState } from "react";
import { updateAnimal } from "@/app/actions/animals";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Animal } from "@prisma/client";

interface EditAnimalFormProps {
    animal: Animal;
}

export default function EditAnimalForm({ animal }: EditAnimalFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await updateAnimal(animal.id, formData).catch(err => {
            // Next.js redirect throws an error, we need to check if it's a redirect
            if (err.message === "NEXT_REDIRECT") {
                throw err;
            }
            setError(err.message || "Ocurrió un error al actualizar la mascota");
            setLoading(false);
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto de la Mascota</label>
                    <div className="flex items-center gap-4">
                        {animal.photo && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                <img src={animal.photo} alt="Vista previa" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <input
                            name="photo"
                            type="file"
                            accept="image/*"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-500">Selecciona una imagen de tu galería (JPEG, PNG).</p>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota</label>
                    <input
                        name="name"
                        type="text"
                        defaultValue={animal.name}
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Ej: Max, Luna..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                    <select
                        name="species"
                        defaultValue={animal.species}
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
                        defaultValue={animal.breed || ""}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Ej: Golden Retriever"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID del Microchip (Opcional)</label>
                    <input
                        name="microchipId"
                        type="text"
                        defaultValue={animal.microchipId || ""}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Número de 15 dígitos"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary justify-center py-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Actualizar Mascota"}
                </button>
                <Link href={`/animals/${animal.id}`} className="flex-1 border border-gray-300 text-gray-600 px-4 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors text-center">
                    Cancelar
                </Link>
            </div>
        </form>
    );
}
