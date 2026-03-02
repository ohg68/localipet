"use client";

import { useState } from "react";
import {
    ShoppingBag,
    X,
    CheckCircle2,
    AlertTriangle,
    Scale,
    UtensilsCrossed,
    Tag
} from "lucide-react";
import { registerPetOrder } from "@/app/actions/vet";

interface OrderRegistrationModalProps {
    animalId: string;
    animalName: string;
    currentFood?: string;
    orgId: string;
}

export default function OrderRegistrationModal({ animalId, animalName, currentFood, orgId }: OrderRegistrationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [foodBrand, setFoodBrand] = useState(currentFood || "");
    const [packageSize, setPackageSize] = useState(10);
    const [dailyGrams, setDailyGrams] = useState(250);

    const handleRegisterOrder = async () => {
        setLoading(true);
        try {
            await registerPetOrder(animalId, orgId, foodBrand, packageSize, dailyGrams);
            setSent(true);
            setTimeout(() => {
                setIsOpen(false);
                setSent(false);
            }, 2000);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm shadow-primary/5 active:scale-95"
            >
                Nueva Venta <ShoppingBag className="w-3 h-3" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/20 animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2.5 rounded-2xl">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic tracking-tight uppercase">Registrar <span className="text-primary">Venta de Alimento</span></h3>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="bg-white p-2 rounded-xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {sent ? (
                    <div className="p-20 text-center flex flex-col items-center animate-in zoom-in-90 duration-500">
                        <div className="bg-green-100 p-6 rounded-full mb-6">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        <h4 className="text-3xl font-black italic mb-4">¡Venta Registrada!</h4>
                        <p className="text-gray-400 font-bold max-w-xs mx-auto italic">El consumo de {animalName} se está calculando ahora mismo para las próximas alertas.</p>
                    </div>
                ) : (
                    <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="mb-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Resumen del Paciente:</p>
                            <h4 className="text-2xl font-black italic text-gray-900 leading-none">{animalName}</h4>
                        </div>

                        <div className="space-y-8">
                            {/* Food Details */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 block ml-1">Marca de Alimento:</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={foodBrand}
                                        onChange={(e) => setFoodBrand(e.target.value)}
                                        placeholder="Ej: Royal Canin Pediatric Dog"
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold tracking-tight focus:border-primary outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 block ml-1">Tamaño Pack (Kg):</label>
                                    <div className="relative">
                                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={packageSize}
                                            onChange={(e) => setPackageSize(Number(e.target.value))}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold tracking-tight focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 block ml-1">Consumo Diario (g):</label>
                                    <div className="relative">
                                        <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={dailyGrams}
                                            onChange={(e) => setDailyGrams(Number(e.target.value))}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold tracking-tight focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4">
                                <AlertTriangle className="w-10 h-10 text-orange-500 shrink-0" />
                                <p className="text-xs font-bold text-orange-700 leading-relaxed italic">
                                    Esto actualizará las alarmas de consumo. El sistema detectará que {animalName} terminará su alimento en aproximadamente <span className="font-black">{(packageSize * 1000 / dailyGrams).toFixed(0)} días</span> y disparará una alerta a los {((packageSize * 1000 / dailyGrams) - 7).toFixed(0)} días.
                                </p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={handleRegisterOrder}
                                disabled={loading || !foodBrand}
                                className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? "Procesando..." : (
                                    <>Finalizar Venta <CheckCircle2 className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
