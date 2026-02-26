"use client";

import { useState } from "react";
import { Scale, Plus, Calendar, Loader2, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { addWeightRecord } from "@/app/actions/health";

interface WeightHistoryProps {
    animalId: string;
    records: any[];
}

export default function WeightHistory({ animalId, records }: WeightHistoryProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            await addWeightRecord(animalId, formData);
            setIsAdding(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate trend
    const getTrend = (current: number, index: number) => {
        if (index === records.length - 1) return null;
        const prev = parseFloat(records[index + 1].weightKg);
        const curr = parseFloat(current.toString());
        if (curr > prev) return <TrendingUp className="w-3 h-3 text-rose-500" />;
        if (curr < prev) return <TrendingDown className="w-3 h-3 text-emerald-500" />;
        return <Minus className="w-3 h-3 text-gray-400" />;
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-500" />
                    Peso (kg)
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Plus className="w-5 h-5 text-primary" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {records.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Scale className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-sm font-medium">Sin registros aún</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {records.map((record, i) => (
                            <div key={record.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-white transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <p className="text-xl font-black text-gray-900 leading-none">
                                            {record.weightKg.toString()}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">kg</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(record.dateRecorded).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {getTrend(record.weightKg, i)}
                                            {record.notes && <p className="text-xs text-gray-500 font-medium italic">{record.notes}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Registrar Peso</h3>
                            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form action={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                                <input
                                    name="weightKg"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                                    placeholder="5.40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                <input
                                    name="dateRecorded"
                                    type="date"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                                <input name="notes" type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" placeholder="Control mensual" />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary justify-center py-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Registro"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
