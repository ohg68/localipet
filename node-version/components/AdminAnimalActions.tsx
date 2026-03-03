"use client";

import { useState } from "react";
import {
    HeartPulse,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Link2Off,
    Loader2,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { toggleAnimalLost, toggleAnimalActive, unlinkTag } from "@/app/actions/admin";
import { translations, Locale } from "@/lib/i18n";

interface AdminAnimalActionsProps {
    animalId: string;
    isLost: boolean;
    isActive: boolean;
    hasTag: boolean;
    locale: Locale;
}

export default function AdminAnimalActions({ animalId, isLost, isActive, hasTag, locale }: AdminAnimalActionsProps) {
    const t = translations[locale];
    const [loading, setLoading] = useState<string | null>(null);

    const handleAction = async (action: string, fn: () => Promise<any>) => {
        if (!confirm(t.admin.animalActions.confirm)) return;
        setLoading(action);
        try {
            await fn();
        } catch (error) {
            console.error(error);
            alert(t.admin.animalActions.error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Toggle Lost Status */}
            {isLost ? (
                <button
                    onClick={() => handleAction("lost", () => toggleAnimalLost(animalId, false))}
                    disabled={!!loading}
                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200"
                    title={t.admin.animalActions.markFound}
                >
                    {loading === "lost" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                </button>
            ) : (
                <button
                    onClick={() => handleAction("lost", () => toggleAnimalLost(animalId, true))}
                    disabled={!!loading}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                    title={t.admin.animalActions.markLost}
                >
                    {loading === "lost" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                </button>
            )}

            {/* Unlink Tag */}
            {hasTag && (
                <button
                    onClick={() => handleAction("unlink", () => unlinkTag(animalId))}
                    disabled={!!loading}
                    className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
                    title={t.admin.animalActions.unlink}
                >
                    {loading === "unlink" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2Off className="w-4 h-4" />}
                </button>
            )}

            {/* Toggle Active Status */}
            <button
                onClick={() => handleAction("active", () => toggleAnimalActive(animalId, !isActive))}
                disabled={!!loading}
                className={`p-2 rounded-lg transition-colors border ${isActive
                    ? "bg-gray-50 text-gray-400 hover:bg-gray-100 border-gray-200"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                    }`}
                title={isActive ? t.admin.animalActions.deactivate : t.admin.animalActions.activate}
            >
                {loading === "active" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className={`w-4 h-4 ${!isActive && "fill-blue-50"}`} />}
            </button>
        </div>
    );
}
