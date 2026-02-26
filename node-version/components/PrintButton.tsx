"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="btn-primary py-3 px-6 flex items-center gap-2 shadow-xl shadow-primary/20"
        >
            <Printer className="w-5 h-5" />
            Imprimir Ahora
        </button>
    );
}
