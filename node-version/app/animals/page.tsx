import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PawPrint, Plus, ChevronRight, QrCode, AlertCircle, X } from "lucide-react";
import { redirect } from "next/navigation";
import LinkTagButton from "@/components/LinkTagButton";

export default async function AnimalsPage({
    searchParams
}: {
    searchParams: Promise<{ pickForToken?: string }>
}) {
    const { pickForToken } = await searchParams;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const animals = await prisma.animal.findMany({
        where: {
            ownerId: session.user.id,
            isActive: true,
        },
        include: {
            qrCode: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="container pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Mascotas</h1>
                    <p className="text-gray-500 font-medium">Gestiona todos tus compañeros registrados.</p>
                </div>
                <Link href="/animals/create" className="btn-primary py-3 px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Registrar Mascota</span>
                </Link>
            </div>

            {pickForToken && (
                <div className="bg-primary/10 border-2 border-primary/20 p-6 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Vincular Nuevo Tag</h2>
                            <p className="text-gray-500 font-medium">Selecciona a qué mascota quieres asignarle el tag <strong>{pickForToken}</strong>.</p>
                        </div>
                    </div>
                    <Link href="/animals" className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-black uppercase tracking-widest text-xs transition-colors group">
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Cancelar
                    </Link>
                </div>
            )}

            {animals.length === 0 ? (
                <div className="card p-20 text-center flex flex-col items-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <PawPrint className="w-16 h-16 text-gray-300 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes mascotas registradas</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Comienza registrando a tu mascota para generar su código QR único y mantener su historial de salud al día.</p>
                    <Link href="/animals/create" className="btn-primary px-8">
                        Registrar mi primera mascota
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {animals.map((animal: any) => (
                        <Link key={animal.id} href={`/animals/${animal.id}`} className="group">
                            <div className={`card overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px] border-2 ${animal.isLost ? 'border-red-500 ring-4 ring-red-500/10' : 'border-transparent'}`}>
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                    {animal.photo ? (
                                        <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <PawPrint className="w-16 h-16" />
                                        </div>
                                    )}
                                    {animal.isLost && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-lg">
                                            Extraviado
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">{animal.name}</h3>
                                    <p className="text-gray-500 font-bold text-sm uppercase tracking-wide mb-4">{animal.species} • {animal.breed || 'Sin raza'}</p>

                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <QrCode className="w-4 h-4" />
                                            {animal.qrCode ? (
                                                <span className="font-mono">#{(animal.qrCode as any).shortCode || animal.qrCode.token.substring(0, 10)}</span>
                                            ) : (
                                                <span>Sin Tag</span>
                                            )}
                                        </div>
                                        {!pickForToken && (
                                            <div className="bg-primary/5 text-primary p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    {pickForToken && (
                                        <div
                                            className="mt-6 pt-4 border-t-2 border-primary/5"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <LinkTagButton
                                                animalId={animal.id}
                                                qrToken={pickForToken}
                                                animalName={animal.name}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
