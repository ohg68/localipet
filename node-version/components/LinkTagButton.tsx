"use client";

import { useState } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { linkAnimalToTag } from "@/app/actions/animals";

interface LinkTagButtonProps {
    animalId: string;
    qrToken: string;
    animalName: string;
}

export default function LinkTagButton({ animalId, qrToken, animalName }: LinkTagButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleLink = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to pet details
        if (!confirm(`¿Estás seguro de que quieres vincular este nuevo Tag a ${animalName}? El código anterior (si existe) dejará de funcionar.`)) {
            return;
        }

        setLoading(true);
        try {
            await linkAnimalToTag(animalId, qrToken);
        } catch (error: any) {
            alert(error.message || "Error al vincular el tag");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLink}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <LinkIcon className="w-5 h-5" />
                    Vincular este Tag
                </>
            )}
        </button>
    );
}
