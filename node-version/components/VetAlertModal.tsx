"use client";

import { useState } from "react";
import {
    BellRing,
    MessageSquare,
    X,
    Loader2,
    CheckCircle2,
    Smartphone,
    Mail,
    Send,
    Smartphone as WhatsApp
} from "lucide-react";
import { createCommunicationLog } from "@/app/actions/vet";
import { Locale, translations } from "@/lib/i18n";

interface VetAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    animalName: string;
    ownerEmail: string;
    ownerId: string;
    orgId: string;
    animalId: string;
    type: "VACCINE" | "FOOD" | "CAMPAIGN";
    defaultMessage: string;
    locale: Locale;
}

export default function VetAlertModal({
    isOpen,
    onClose,
    animalName,
    ownerEmail,
    ownerId,
    orgId,
    animalId,
    type,
    defaultMessage,
    locale
}: VetAlertModalProps) {
    const [tone, setTone] = useState<"formal" | "caring">("caring");
    const [message, setMessage] = useState(defaultMessage);
    const [channel, setChannel] = useState<"APP" | "WHATSAPP" | "EMAIL">("APP");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const t = translations[locale];

    const generateMessage = (selectedTone: "formal" | "caring") => {
        const typeKey = type.toLowerCase() as "vaccine" | "food" | "campaign";
        const toneKey = selectedTone === "formal" ? "Formal" : "Caring";
        const key = `${typeKey}${toneKey}` as keyof typeof t.vet.alerts;
        const template = t.vet.alerts[key] as string;

        return template.replace("{name}", animalName);
    };

    const handleToneChange = (newTone: "formal" | "caring") => {
        setTone(newTone);
        setMessage(generateMessage(newTone));
    };

    if (!isOpen) return null;

    const handleSend = async () => {
        setLoading(true);
        try {
            await createCommunicationLog({
                organizationId: orgId,
                userId: ownerId,
                animalId,
                type,
                channel,
                content: message,
                status: "SENT",
                sentAt: new Date()
            });

            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
            }, 2000);
        } catch (error) {
            console.error(error);
            alert(t.vet.alerts.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                            <BellRing className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic">{t.vet.alerts.modalTitle}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.vet.alerts.modalDesc.replace("{name}", animalName)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 flex-1">
                    {sent ? (
                        <div className="py-12 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                            <div className="bg-green-100 p-6 rounded-full text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 italic">{t.vet.alerts.sent}</h4>
                            <p className="text-gray-400 font-medium italic">
                                {t.vet.alerts.sentDesc
                                    .replace("{type}", type.toLowerCase())
                                    .replace("{channel}", channel)}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Channel Selector */}
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t.vet.alerts.channelLabel}</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: "APP", label: "Localipet App", icon: Smartphone },
                                        { id: "WHATSAPP", label: "WhatsApp", icon: WhatsApp },
                                        { id: "EMAIL", label: "Email", icon: Mail },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setChannel(c.id as any)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${channel === c.id
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-100 hover:border-gray-200 text-gray-400"
                                                }`}
                                        >
                                            <c.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <button
                                        onClick={() => handleToneChange("caring")}
                                        className={`py-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest ${tone === "caring" ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-100 text-gray-400"
                                            }`}
                                    >
                                        {t.vet.alerts.caring}
                                    </button>
                                    <button
                                        onClick={() => handleToneChange("formal")}
                                        className={`py-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest ${tone === "formal" ? "border-gray-800 bg-gray-50 text-gray-800" : "border-gray-100 text-gray-400"
                                            }`}
                                    >
                                        {t.vet.alerts.professional}
                                    </button>
                                </div>
                            </div>

                            {/* Message Editor */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t.vet.alerts.customMessage}</p>
                                    <span className="text-[10px] font-bold text-primary italic">{t.vet.alerts.modeT.replace("{tone}", tone === "caring" ? t.vet.alerts.caring : t.vet.alerts.professional)}</span>
                                </div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full h-40 p-6 rounded-[2rem] border-2 border-gray-100 focus:border-primary outline-none text-gray-700 font-medium italic leading-relaxed resize-none bg-gray-50/30"
                                    placeholder={t.vet.alerts.placeholder}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!sent && (
                    <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/30">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                            {t.vet.alerts.cancel}
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="flex-2 py-4 px-10 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {t.vet.alerts.sendBtn}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
