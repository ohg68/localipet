import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Printer, CreditCard } from "lucide-react";
import QRCode from "qrcode";
import PrintButton from "@/components/PrintButton";

export default async function AnimalIDCardPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
        include: {
            qrCode: true,
            owner: {
                include: {
                    profile: true,
                },
            },
        },
    });

    if (!animal || animal.ownerId !== session?.user?.id) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const scanUrl = `${baseUrl}/s/${animal.qrCode?.token}`;
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        width: 400,
        margin: 1,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });

    return (
        <div className="container max-w-4xl py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12 print:hidden">
                <Link
                    href={`/animals/${animal.id}`}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Regresar a {animal.name}
                </Link>

                <div className="flex gap-4">
                    <PrintButton />
                </div>
            </div>

            <div className="text-center mb-12 print:hidden">
                <h1 className="text-4xl font-black text-gray-900 mb-4">DNI de {animal.name}</h1>
                <p className="text-gray-500 font-medium">Una tarjeta de identificación premium para llevar siempre contigo.</p>
            </div>

            {/* DNI Card Container */}
            <div className="flex justify-center">
                <div className="id-card-container print:m-0">
                    <div className="id-card relative bg-[#f8f9fa] w-[500px] h-[300px] rounded-[15px] shadow-2xl overflow-hidden border border-gray-200 flex flex-col font-sans select-none">
                        {/* Chip Graphic */}
                        <div className="absolute top-[80px] left-[25px] w-[50px] h-[40px] bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 rounded-[5px] border border-amber-600/30 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-[1px] bg-amber-800/20 absolute top-1/4"></div>
                            <div className="w-full h-[1px] bg-amber-800/20 absolute top-2/4"></div>
                            <div className="w-full h-[1px] bg-amber-800/20 absolute top-3/4"></div>
                            <div className="h-full w-[1px] bg-amber-800/20 absolute left-1/3"></div>
                            <div className="h-full w-[1px] bg-amber-800/20 absolute left-2/3"></div>
                        </div>

                        {/* Top Bar */}
                        <div className="h-[45px] bg-gradient-to-r from-primary to-primary/80 flex items-center px-6 justify-between border-b-2 border-primary/20">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-black text-primary">LP</span>
                                </div>
                                <span className="text-white text-[12px] font-black tracking-widest uppercase italic">Localipet Documento de Identidad</span>
                            </div>
                            <div className="text-white/60 text-[10px] font-bold">SERIAL: {(animal.qrCode as any)?.shortCode || "PENDING"}</div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex px-6 py-4 gap-6 bg-[radial-gradient(circle_at_50%_50%,_rgba(var(--primary-rgb),0.02)_0%,_transparent_100%)]">
                            {/* Photo Slot */}
                            <div className="w-[120px] pt-12">
                                <div className="aspect-[3/4] bg-white rounded-lg border-2 border-gray-100 shadow-inner overflow-hidden flex items-center justify-center relative grayscale-[0.2]">
                                    {animal.photo ? (
                                        <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-200">
                                            <CreditCard className="w-12 h-12" />
                                        </div>
                                    )}
                                    {/* Security Watermark on photo */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center rotate-45">
                                        <span className="text-[8px] font-black uppercase text-primary whitespace-nowrap tracking-[1em]">LOCALIPET SECURITY</span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Fields */}
                            <div className="flex-1 space-y-2 pt-2">
                                <div>
                                    <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">Primer Apellido / Nombre</label>
                                    <p className="text-[15px] font-black text-gray-800 uppercase leading-none">{animal.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">Especie</label>
                                        <p className="text-[10px] font-black text-gray-800 uppercase italic leading-none">{animal.species}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">Sexo</label>
                                        <p className="text-[10px] font-black text-gray-800 uppercase leading-none">{animal.sex === "MACHO" ? "M" : "H"}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">Raza</label>
                                    <p className="text-[10px] font-black text-gray-800 uppercase leading-none">{animal.breed || "MESTIZO"}</p>
                                </div>

                                <div>
                                    <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">ID Microchip</label>
                                    <p className="text-[10px] font-mono font-bold text-gray-800 leading-none">{animal.microchipId || "NO REGISTRADO"}</p>
                                </div>

                                <div>
                                    <label className="block text-[7px] font-black text-primary/60 uppercase tracking-tighter">Propietario</label>
                                    <p className="text-[10px] font-bold text-gray-700 leading-none truncate max-w-[150px]">{(animal.owner as any).name || "PENDIENTE"}</p>
                                </div>
                            </div>

                            {/* QR Section */}
                            <div className="w-[100px] flex flex-col items-center justify-center gap-2">
                                <div className="p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <img src={qrDataUrl} alt="QR Code" className="w-[70px] h-[70px]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-tighter">Escanear para info</p>
                                    <p className="text-[10px] font-black text-primary mt-0.5">#{(animal.qrCode as any)?.shortCode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Hologram area */}
                        <div className="h-[25px] px-6 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500/10"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500/10"></div>
                                <div className="w-2 h-2 rounded-full bg-rose-500/10"></div>
                            </div>
                            <span className="text-[7px] font-black text-gray-300 italic uppercase">© 2026 Localipet Systems • Non-Official Document</span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body { visibility: hidden; background: white !important; }
                    .container { padding: 0 !important; max-width: none !important; margin: 0 !important; }
                    .id-card-container { 
                        visibility: visible; 
                        position: absolute; 
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%) scale(1.2);
                        box-shadow: none !important;
                    }
                    .id-card { 
                        box-shadow: none !important; 
                        border: 1px solid #eee !important;
                    }
                }
            `}} />
        </div>
    );
}
