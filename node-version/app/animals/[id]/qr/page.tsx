import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Download, Printer, Share2 } from "lucide-react";
import QRCode from "qrcode";
import DownloadButtons from "@/components/DownloadButtons";
import PrintButton from "@/components/PrintButton";

export default async function AnimalQRPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
        include: { qrCode: true },
    });

    if (!animal || animal.ownerId !== session?.user?.id || !animal.qrCode) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const scanUrl = `${baseUrl}/s/${animal.qrCode.token}`;
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        width: 1024,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });

    return (
        <div className="container max-w-2xl py-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 print:hidden">
                <Link
                    href={`/animals/${animal.id}`}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Regresar a {animal.name}
                </Link>

                <PrintButton />
            </div>

            <div className="text-center mb-10 print:mb-4">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Código QR de Identificación</h1>
                <p className="text-gray-500 font-medium print:hidden">Este código es único para {animal.name}. Imprímelo y colócalo en su collar.</p>
            </div>

            <div className="card p-10 flex flex-col items-center bg-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

                <div className="bg-white p-6 rounded-2xl shadow-inner border border-gray-100 mb-6">
                    <img src={qrDataUrl} alt={`QR Code for ${animal.name}`} className="w-64 h-64 md:w-80 md:h-80" />
                </div>

                {(animal.qrCode as any).shortCode && (
                    <div className="text-center mb-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Código de Búsqueda Manual</p>
                        <div className="inline-flex items-center gap-2 bg-gray-50 border-2 border-gray-100 px-6 py-3 rounded-2xl">
                            <span className="text-primary font-black text-2xl">#</span>
                            <span className="text-2xl font-mono font-black tracking-widest text-gray-900">{(animal.qrCode as any).shortCode}</span>
                        </div>
                    </div>
                )}

                <div className="w-full space-y-4 print:hidden">
                    <DownloadButtons qrDataUrl={qrDataUrl} animalName={animal.name} />

                    <div className="pt-6 border-t border-gray-100 print:hidden">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center mb-4">Enlace de la ficha pública</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-4">
                            <code className="text-[10px] md:text-sm text-gray-600 truncate flex-1">{scanUrl}</code>
                            <button className="text-primary font-bold text-xs hover:underline flex items-center gap-1 shrink-0">
                                <Share2 className="w-4 h-4" /> Compartir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Consejo de Impresión
                    </h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Para mejores resultados, imprime el código en papel adhesivo resistente al agua o plastifícalo antes de colocarlo en el collar.
                    </p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Formato de Alta Calidad
                    </h3>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                        La imagen descargada tiene una resolución de 1024px, ideal para cualquier tipo de impresión profesional.
                    </p>
                </div>
            </div>
        </div>
    );
}
