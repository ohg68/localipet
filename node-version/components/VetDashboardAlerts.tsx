"use client";

import { useState } from "react";
import { BellRing, Calendar, ShoppingBag, HeartPulse, ShoppingCart } from "lucide-react";
import VetAlertModal from "./VetAlertModal";
import { Locale, translations } from "@/lib/i18n";

interface VetAlert {
    id: string;
    animalId: string;
    animalName: string;
    ownerEmail: string;
    ownerId: string;
    type: "VACCINE" | "FOOD" | "CAMPAIGN";
    title: string;
    dateLabel?: string;
}

export default function VetDashboardAlerts({ alerts, orgId, locale }: { alerts: VetAlert[], orgId: string, locale: Locale }) {
    const [selectedAlert, setSelectedAlert] = useState<VetAlert | null>(null);
    const [tone, setTone] = useState<"formal" | "caring">("caring");
    const t = translations[locale];

    const generateDefaultMessage = (alert: VetAlert, selectedTone: "formal" | "caring") => {
        const type = alert.type.toLowerCase() as "vaccine" | "food" | "campaign";
        const toneKey = selectedTone === "formal" ? "Formal" : "Caring";
        const key = `${type}${toneKey}` as keyof typeof t.vet.alerts;
        const template = t.vet.alerts[key] as string;

        return template
            .replace("{name}", alert.animalName)
            .replace("{title}", alert.title)
            .replace("{date}", alert.dateLabel || "");
    };

    return (
        <div className="space-y-8">
            {/* Tone Selector */}
            <div className="flex items-center gap-4 bg-white w-fit p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                <button
                    onClick={() => setTone("caring")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tone === "caring" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-gray-600"}`}
                >
                    {t.vet.alerts.caring}
                </button>
                <button
                    onClick={() => setTone("formal")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tone === "formal" ? "bg-gray-800 text-white shadow-lg shadow-gray-800/20" : "text-gray-400 hover:text-gray-600"}`}
                >
                    {t.vet.alerts.professional}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Upcoming Vaccines Card */}
                <div className="card border-0 shadow-2xl shadow-primary/5 min-h-[400px] flex flex-col rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-xl font-black bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent flex items-center gap-3">
                            <HeartPulse className="w-6 h-6 text-primary" />
                            {t.vet.alerts.vaccineTitle}
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        {alerts.filter(a => a.type === "VACCINE").length > 0 ? (
                            <div className="space-y-4">
                                {alerts.filter(a => a.type === "VACCINE").map((a) => (
                                    <div key={a.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 italic">{a.title}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                    {t.vet.alerts.pet}: <span className="text-gray-900 italic">{a.animalName}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAlert(a)}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:scale-110 p-4 rounded-2xl hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100"
                                        >
                                            {t.vet.alerts.supervise} <BellRing className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center text-gray-400 font-bold italic">{t.vet.alerts.notSupervisor}</div>
                        )}
                    </div>
                </div>

                {/* Food Habits Card */}
                <div className="card border-0 shadow-2xl shadow-primary/5 min-h-[400px] flex flex-col rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                            {t.vet.alerts.consumptionTitle}
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        {alerts.filter(a => a.type === "FOOD").length > 0 ? (
                            <div className="space-y-4">
                                {alerts.filter(a => a.type === "FOOD").map((a) => (
                                    <div key={a.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                                <ShoppingCart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 italic">{t.vet.alerts.repose.replace("{title}", a.title)}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                    {t.vet.alerts.pet}: <span className="text-gray-900 italic">{a.animalName}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAlert(a)}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:scale-110 p-4 rounded-2xl hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100"
                                        >
                                            {t.vet.alerts.supervise} <BellRing className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center text-gray-400 font-bold italic">{t.vet.alerts.enoughStock}</div>
                        )}
                    </div>
                </div>

                {selectedAlert && (
                    <VetAlertModal
                        isOpen={!!selectedAlert}
                        onClose={() => setSelectedAlert(null)}
                        animalName={selectedAlert.animalName}
                        ownerEmail={selectedAlert.ownerEmail}
                        ownerId={selectedAlert.ownerId}
                        orgId={orgId}
                        animalId={selectedAlert.animalId}
                        type={selectedAlert.type}
                        defaultMessage={generateDefaultMessage(selectedAlert, tone)}
                        locale={locale}
                    />
                )}
            </div>
        </div>
    );
}
