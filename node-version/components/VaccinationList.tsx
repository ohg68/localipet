"use client";

import { useState } from "react";
import { Syringe, Plus, Calendar, Loader2, X, AlertCircle } from "lucide-react";
import { addVaccination } from "@/app/actions/health";

interface VaccinationListProps {
    animalId: string;
    vaccinations: any[];
}

export default function VaccinationList({ animalId, vaccinations }: VaccinationListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            await addVaccination(animalId, formData);
            setIsAdding(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-indigo-500" />
                    Vacunas
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Plus className="w-5 h-5 text-primary" />
                </button>
            </div>

            <div className="p-4 h-[250px] overflow-y-auto">
                {vaccinations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Syringe className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-sm">Sin registros</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vaccinations.map((vac) => (
                            <div key={vac.id} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-900">{vac.name}</p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(vac.dateAdministered).toLocaleDateString()}
                                    </p>
                                </div>
                                {vac.nextDueDate && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full w-fit font-bold border border-amber-100">
                                        <AlertCircle className="w-3 h-3" />
                                        Próxima: {new Date(vac.nextDueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Nueva Vacuna</h3>
                            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form action={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Vacuna</label>
                                <input name="name" type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" placeholder="Triple Felina, Rabia..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Aplicación</label>
                                <input
                                    name="dateAdministered"
                                    type="date"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Dosis (Opcional)</label>
                                <input name="nextDueDate" type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary justify-center py-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Vacuna"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
