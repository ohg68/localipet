import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, User, Activity, Weight, Calendar, Hash } from "lucide-react";
import Link from "next/link";
import MedicalNotesManager from "@/components/MedicalNotesManager";

export default async function VetAnimalDetailsPage({
    params,
    searchParams
}: {
    params: { animalId: string };
    searchParams: { orgId?: string };
}) {
    const session = await auth();
    if (!session) redirect("/");

    let orgId = searchParams.orgId;

    if (!orgId) {
        // Fallback to first org
        const firstMembership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id }
        });
        if (firstMembership) {
            orgId = firstMembership.organizationId;
        } else {
            return <div>No autorizado</div>;
        }
    }

    const locale = await getLocale();
    const t = translations[locale];

    // Get the animal
    const animal = await prisma.animal.findUnique({
        where: { id: params.animalId },
        include: {
            owner: true,
            vaccinations: {
                orderBy: { dateAdministered: 'desc' },
            },
            qrCode: true,
        }
    });

    if (!animal) {
        return <div>Mascota no encontrada en el sistema.</div>;
    }

    const { owner } = animal;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Nav */}
            <Link href={`/vet/animals?orgId=${orgId}`} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a Lista de Pacientes
            </Link>

            {/* Profile Header */}
            <div className="card p-10 border-0 shadow-2xl shadow-primary/5 rounded-[3.5rem] bg-white relative overflow-hidden flex flex-col md:flex-row gap-10 items-center md:items-start group">
                <div className="absolute top-0 right-0 p-3 bg-brand-50 text-brand-600 rounded-bl-3xl font-black uppercase tracking-widest text-xs z-10 border-l border-b border-brand-100/50 flex gap-2">
                    <Hash className="w-4 h-4" /> {animal.qrCode?.shortCode || "SIN TAG"}
                </div>

                <div className="w-48 h-48 rounded-[3rem] overflow-hidden bg-brand-100 flex-shrink-0 relative shadow-inner border-4 border-white">
                    {animal.photo ? (
                        <Image src={animal.photo} alt={animal.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-500 font-black text-6xl italic">
                            {animal.name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-5xl font-black text-gray-900 italic tracking-tight">{animal.name}</h1>
                        <p className="text-xl font-bold uppercase tracking-widest text-brand-500 mt-2">
                            {animal.breed || animal.species} • {(animal as any).sex === 'male' ? 'MACHO' : 'HEMBRA'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <User className="w-5 h-5 text-gray-400 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dueño Identificado</p>
                            <p className="font-bold text-gray-900 truncate mt-1">{owner.firstName} {owner.lastName}</p>
                            <p className="text-xs font-bold text-gray-500 truncate mt-0.5">{owner.email}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <Activity className="w-5 h-5 text-rose-400 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Estado Clínico</p>
                            <p className="font-bold text-gray-900 truncate mt-1">{animal.isActive ? 'Activo' : 'Inactivo'}</p>
                            <p className="text-xs font-bold text-gray-500 truncate mt-0.5">Sin alertas críticas</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Última Vacuna</p>
                            <p className="font-bold text-gray-900 truncate mt-1">
                                {animal.vaccinations[0] ? animal.vaccinations[0].name : "No registrada"}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <Weight className="w-5 h-5 text-purple-400 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Peso Actual</p>
                            <p className="font-bold text-gray-900 mt-1">{animal.weightKg ? `${animal.weightKg} kg` : "N/D"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical Notes Manager */}
            <MedicalNotesManager animalId={animal.id} orgId={orgId} locale={locale} />
        </div>
    );
}
