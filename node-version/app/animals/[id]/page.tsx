import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode as QrIcon, Camera, Tag, Pencil, AlertTriangle, MessageSquare, CreditCard } from "lucide-react";
import QRCode from "qrcode";
import ToggleLostButton from "@/components/ToggleLostButton";
import WeightHistory from "@/components/WeightHistory";
import VaccinationList from "@/components/VaccinationList";
import DownloadButtons from "@/components/DownloadButtons";

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
        include: {
            qrCode: true,
            vaccinations: {
                orderBy: { dateAdministered: 'desc' }
            },
            weightRecords: {
                orderBy: { dateRecorded: 'desc' }
            },
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

    // Generate QR Data URL
    const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${animal.qrCode?.token}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
            dark: "#212529",
            light: "#ffffff",
        },
    });

    return (
        <div className="container">
            <nav className="mb-6">
                <Link href="/animals" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Mis Mascotas</span>
                </Link>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Media & QR */}
                <div className="space-y-6">
                    <div className="card overflow-hidden">
                        <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                            <Camera className="w-16 h-16 opacity-20" />
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-white p-4 inline-block rounded-lg shadow-sm border border-gray-100 mb-4">
                                <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                            </div>
                            <div className="space-y-3">
                                <DownloadButtons qrDataUrl={qrDataUrl} animalName={animal.name} />
                                <Link
                                    href={`/animals/${animal.id}/qr`}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-xl font-bold border border-gray-100 hover:bg-gray-100 transition-all text-sm"
                                >
                                    <QrIcon className="w-4 h-4" />
                                    Pantalla de Impresión
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    {animal.name}
                                    {animal.isLost && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold animate-pulse">
                                            Extraviado
                                        </span>
                                    )}
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <ToggleLostButton animalId={animal.id} isLost={animal.isLost} />
                                <Link href={`/animals/${animal.id}/edit`} className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                                    <Pencil className="w-4 h-4 text-gray-600" />
                                </Link>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-uppercase text-gray-500 font-bold mb-1">Especie</p>
                                <p className="font-medium capitalize">{animal.species.toLowerCase()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-uppercase text-gray-500 font-bold mb-1">Raza</p>
                                <p className="font-medium">{animal.breed || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-uppercase text-gray-500 font-bold mb-1">Microchip</p>
                                <p className="font-medium font-mono">{animal.microchipId || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-uppercase text-gray-500 font-bold mb-1">Sexo</p>
                                <p className="font-medium capitalize">{animal.sex}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WeightHistory animalId={animal.id} records={animal.weightRecords} />
                        <VaccinationList animalId={animal.id} vaccinations={animal.vaccinations} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href={`/animals/${animal.id}/scans`} className="card p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-primary/20">
                            <h3 className="font-bold flex items-center gap-2 mb-1">
                                <QrIcon className="w-4 h-4 text-amber-500" />
                                Escaneos
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Historial de ubicación</p>
                        </Link>
                        <Link href={`/animals/${animal.id}/messages`} className="card p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-primary/20">
                            <h3 className="font-bold flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                Mensajes
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Personas que lo vieron</p>
                        </Link>
                        <Link href={`/animals/${animal.id}/id-card`} className="card p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-primary/20">
                            <h3 className="font-bold flex items-center gap-2 mb-1">
                                <CreditCard className="w-4 h-4 text-emerald-500" />
                                DNI
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Tarjeta para imprimir</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
