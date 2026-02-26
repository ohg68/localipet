"use client";

import { useTransition } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toggleAnimalLostStatus } from "@/app/actions/animals";

interface ToggleLostButtonProps {
    animalId: string;
    isLost: boolean;
}

export default function ToggleLostButton({ animalId, isLost }: ToggleLostButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            await toggleAnimalLostStatus(animalId, isLost);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`btn-sm px-4 py-2 rounded-md text-sm font-medium border ${isLost
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                } transition-colors flex items-center gap-2 disabled:opacity-50`}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLost ? (
                <CheckCircle className="w-4 h-4" />
            ) : (
                <AlertTriangle className="w-4 h-4" />
            )}
            {isLost ? 'Marcar como Encontrado' : 'Marcar como Extraviado'}
        </button>
    );
}
