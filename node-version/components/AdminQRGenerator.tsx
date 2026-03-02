"use client";

import { useState } from "react";
import { QrCode, Download, Loader2, Plus, Table, CheckCircle, ExternalLink } from "lucide-react";
import { generateQRBatch } from "@/app/actions/admin";

interface AdminQRGeneratorProps {
    initialCodes: { token: string; shortCode: string; url: string; createdAt: Date }[];
}

export default function AdminQRGenerator({ initialCodes }: AdminQRGeneratorProps) {
    const [quantity, setQuantity] = useState(10);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [codes, setCodes] = useState(initialCodes);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateQRBatch(quantity);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                // In a real app we'd refresh the list, for now user can reload or we can fetch again
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Error al generar códigos");
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = "Token,ShortCode,URL,Fecha de Creación\n";
        const rows = codes.map(c => `${c.token},${c.shortCode},${c.url},${c.createdAt}`).join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `localipet_qr_batch_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="card p-8 border-2 border-primary/10">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <Plus className="w-6 h-6 text-primary" />
                        Generar Nuevo Lote
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad (Max 1000)</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                min="1"
                                max="1000"
                                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary outline-none transition-all text-lg font-black"
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><QrCode className="w-6 h-6" /> Generar Lote</>}
                        </button>
                        {success && (
                            <div className="flex items-center gap-2 text-secondary font-bold justify-center animate-in fade-in slide-in-from-top-2">
                                <CheckCircle className="w-5 h-5" /> ¡Lote generado con éxito!
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats / Info */}
                <div className="lg:col-span-2 card p-8 bg-gray-900 text-white border-0 shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-black mb-2 italic">Dashboard de Impresión</h2>
                            <p className="text-gray-400 font-medium">Gestiona y exporta los códigos para fabricación masiva de tags.</p>
                        </div>
                        <button
                            onClick={downloadCSV}
                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <Download className="w-5 h-5" /> Exportar CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total sin asignar</p>
                            <p className="text-4xl font-black text-primary">{codes.length}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Formato de Salida</p>
                            <p className="text-xl font-black">CSV / Excel Ready</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-black flex items-center gap-2">
                        <Table className="w-5 h-5 text-gray-400" />
                        Últimos Códigos Generados
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Token</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">ShortCode</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">URL del Tag</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {codes.map((code) => (
                                <tr key={code.token} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-primary">{code.token}</td>
                                    <td className="px-6 py-4 text-sm font-black text-gray-800">#{code.shortCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium truncate max-w-xs">{code.url}</td>
                                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(code.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <a href={code.url} target="_blank" className="text-gray-400 hover:text-primary transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
