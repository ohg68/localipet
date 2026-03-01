import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, Phone, Mail, MapPin, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import FinderMessageForm from "@/components/FinderMessageForm";

export default async function PublicScanPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const qrCode = await prisma.qRCode.findUnique({
        where: { token, isActive: true },
        include: {
            animal: {
                include: {
                    owner: {
                        include: {
                            profile: true,
                        }
                    }
                }
            }
        }
    });

    if (!qrCode) {
        notFound();
    }

    if (!qrCode.animalId) {
        redirect(`/register-tag/${token}`);
    }

    const animal = qrCode.animal;
    if (!animal) {
        notFound();
    }
    const { owner } = animal;

    // Log scan (Server-side)
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";

    // Create scan log asynchronously
    await prisma.scanLog.create({
        data: {
            qrCodeId: qrCode.id,
            ipAddress,
            userAgent,
        }
    });

    return (
        <div className="container max-w-lg pt-4 pb-12">
            {animal.isLost && (
                <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h2 className="font-bold text-lg">¡MASCOTA EXTRAVIADA!</h2>
                        <p className="text-sm opacity-90">Su dueño la está buscando intensamente. Por favor, ayuda a que regrese a casa.</p>
                    </div>
                </div>
            )}

            <div className="card shadow-xl overflow-hidden">
                <div className="h-64 bg-gray-200 relative flex items-center justify-center">
                    {animal.photo ? (
                        <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover" />
                    ) : (
                        <Heart className="w-20 h-20 text-gray-300" />
                    )}
                    <div className="absolute bottom-4 left-4">
                        <h1 className="text-4xl font-black text-white drop-shadow-lg uppercase tracking-tight">
                            {animal.name}
                        </h1>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Especie</p>
                            <p className="font-bold capitalize">{animal.species.toLowerCase()}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Raza</p>
                            <p className="font-bold truncate">{animal.breed || "Mestizo"}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Contacto del Dueño</h3>

                        <a href={`tel:${owner.profile?.phone}`} className="flex items-center gap-4 bg-primary text-white p-4 rounded-2xl shadow-lg border-b-4 border-green-700 hover:translate-y-[-2px] transition-all active:translate-y-0">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-80 lg:mt-1">Llamar Ahora</p>
                                <p className="text-xl font-black tabular-nums">{owner.profile?.phone || "No disponible"}</p>
                            </div>
                        </a>

                        <div className="grid grid-cols-1 gap-2">
                            <FinderMessageForm qrCodeId={qrCode.id} />
                        </div>
                    </div>

                    {animal.medicalNotes && (
                        <div className="mt-8 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                            <h4 className="text-amber-800 font-bold mb-1 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Información Médica Importante
                            </h4>
                            <p className="text-amber-900 text-sm leading-relaxed">
                                {animal.medicalNotes}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400">
                <Link href="/" className="flex items-center justify-center gap-2 text-xs hover:text-primary transition-colors">
                    <Heart className="w-3 h-3" />
                    <span>Impulsado por Localipet</span>
                </Link>
            </div>
        </div>
    );
}
