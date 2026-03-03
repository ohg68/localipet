import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Phone, Mail, FileText, Heart, ShieldAlert, CheckCircle2 } from "lucide-react";

export default async function PublicPetProfile({ params }: { params: { id: string } }) {
    const { id } = params;

    const pet = await prisma.animal.findUnique({
        where: { id },
        include: {
            owner: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    profile: {
                        select: {
                            phone: true,
                            city: true,
                            country: true,
                        }
                    }
                }
            },
            photos: {
                orderBy: { isPrimary: 'desc' },
                take: 1
            },
            vaccinations: {
                orderBy: { dateAdministered: 'desc' },
                take: 3
            },
            appointments: {
                orderBy: { date: 'desc' },
                take: 1
            }
        }
    });

    if (!pet) {
        notFound();
    }

    const primaryPhoto = pet.photo || (pet.photos.length > 0 ? pet.photos[0].image : null);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Banner */}
            <div className="w-full bg-emerald-600 h-48 relative">
                {/* Pet Photo overlaps header */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-emerald-50 shadow-lg relative">
                        {primaryPhoto ? (
                            <Image
                                src={primaryPhoto}
                                alt={pet.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Heart className="w-12 h-12 text-emerald-300" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-6 pt-20 pb-12 space-y-6">
                {/* Pet Identity */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">{pet.name}</h1>
                    <p className="text-emerald-700 font-semibold tracking-wide uppercase text-sm mt-1">
                        {pet.species === 'DOG' ? 'Perro' : pet.species === 'CAT' ? 'Gato' : pet.species} • {pet.breed || 'Mestizo'}
                    </p>
                    <div className="flex gap-2 justify-center mt-3">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
                            {pet.sex === 'MALE' ? 'Macho' : pet.sex === 'FEMALE' ? 'Hembra' : 'Desconocido'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
                            {pet.isNeutered ? 'Castrado/Esterilizada' : 'No Castrado/a'}
                        </span>
                    </div>
                </div>

                {/* Important Alert Message if marked as lost (for future expansion) */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 shadow-sm mt-4">
                    <ShieldAlert className="w-6 h-6 flex-shrink-0 text-amber-600" />
                    <p className="text-sm font-medium">
                        Si encontraste a {pet.name}, por favor contacta inmediatamente a su dueño.
                    </p>
                </div>

                {/* Contact Information */}
                {(pet.owner || pet.ownerId) && (
                    <div className="rounded-xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
                        <div className="flex flex-col space-y-1.5 p-6 bg-emerald-50/50 pb-4">
                            <h3 className="font-semibold leading-none tracking-tight text-lg flex items-center gap-2 text-slate-800">
                                <Heart className="w-5 h-5 text-emerald-500" />
                                Contacto del Dueño
                            </h3>
                        </div>
                        <div className="p-6 pt-4 space-y-4">
                            {pet.owner ? (
                                <>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <span className="font-bold text-slate-500">{pet.owner.firstName?.[0] || 'U'}</span>
                                        </div>
                                        <span className="font-medium text-slate-800">{pet.owner.firstName} {pet.owner.lastName}</span>
                                    </div>

                                    {pet.owner.profile?.phone && (
                                        <a href={`tel:${pet.owner.profile.phone}`} className="flex items-center gap-3 text-emerald-600 hover:bg-emerald-50 p-2 -mx-2 rounded-lg transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{pet.owner.profile.phone}</span>
                                        </a>
                                    )}

                                    <a href={`mailto:${pet.owner.email}`} className="flex items-center gap-3 text-emerald-600 hover:bg-emerald-50 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">{pet.owner.email}</span>
                                    </a>

                                    {(pet.owner.profile?.city || pet.owner.profile?.country) && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span>{[pet.owner.profile.city, pet.owner.profile.country].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-500 italic">Información de contacto privada.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Characteristics and Details */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm text-slate-950">
                    <div className="flex flex-col space-y-1.5 p-6 pb-2">
                        <h3 className="font-semibold leading-none tracking-tight text-lg text-slate-800">Detalles</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 pt-2">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Color</p>
                            <p className="text-slate-800 font-medium">{pet.color || 'No especificado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Microchip</p>
                            <p className="text-slate-800 font-medium">{pet.microchipId || 'Ninguno'}</p>
                        </div>
                        {pet.dateOfBirth && (
                            <div className="col-span-2">
                                <p className="text-xs text-slate-500 font-medium uppercase">Fecha de Nacimiento</p>
                                <p className="text-slate-800 font-medium">{pet.dateOfBirth.toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Health & Medical Summary */}
                <div className="rounded-xl shadow-sm overflow-hidden border border-slate-200 bg-white text-slate-950">
                    <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 pb-3 border-b border-slate-100">
                        <h3 className="font-semibold leading-none tracking-tight text-lg flex items-center gap-2 text-slate-800">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Resumen de Salud
                        </h3>
                    </div>
                    <div className="p-6 pt-4 space-y-4">
                        {pet.vaccinations.length > 0 ? (
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-2">Últimas Vacunas</p>
                                <div className="space-y-2">
                                    {pet.vaccinations.map((vaccine: any) => (
                                        <div key={vaccine.id} className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium text-slate-700 text-sm">{vaccine.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">{vaccine.dateAdministered.toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm">No hay registros recientes de vacunas.</p>
                        )}
                    </div>
                </div>

                {/* Localipet Branding */}
                <div className="text-center pt-8 pb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-2">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Perfil verificado por <span className="text-emerald-600 font-bold">Localipet</span></p>
                </div>
            </main>
        </div>
    );
}
