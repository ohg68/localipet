"use client";

import { Tag, QrCode } from "lucide-react";

interface DownloadButtonsProps {
    qrDataUrl: string;
    animalName: string;
}

export default function DownloadButtons({ qrDataUrl, animalName }: DownloadButtonsProps) {
    const downloadQR = () => {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `QR_${animalName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadLabel = () => {
        // Simple implementation: print the page or a specific label div
        // For now, let's just alert or open a print window
        window.print();
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={downloadQR}
                className="text-xs border border-gray-200 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center gap-1 font-bold text-gray-700"
            >
                <QrCode className="w-3 h-3" /> Descargar QR
            </button>
            <button
                onClick={downloadLabel}
                className="text-xs border border-gray-200 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center gap-1 font-bold text-gray-700"
            >
                <Tag className="w-3 h-3" /> Imprimir Etiqueta
            </button>
        </div>
    );
}
