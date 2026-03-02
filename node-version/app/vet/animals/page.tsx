import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
    PawPrint,
    Search,
    User,
    ChevronRight,
    Filter,
    Plus,
    ShoppingBag,
    Activity,
    HeartPulse
} from "lucide-react";
import Link from "next/link";
import OrderRegistrationModal from "@/components/OrderRegistrationModal";

export default async function VetAnimalsPage({ searchParams }: { searchParams: { orgId?: string } }) {
    const session = await auth();
    const userMemberships = await prisma.organizationMember.findMany({
        where: { userId: session?.user.id },
        include: { organization: true }
    });

    const activeOrgId = searchParams.orgId || userMemberships[0]?.organizationId;
    if (!activeOrgId) return <div>No autorizado</div>;

    // Fetch all animals belonging to clients of this organization
    const clients = await prisma.organizationClient.findMany({
        where: { organizationId: activeOrgId, isActive: true },
        include: {
            user: {
                include: {
                    animals: {
                        include: {
                            qrCode: true,
                            vaccinations: {
                                orderBy: { nextDueDate: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            }
        }
    });

    const animals = clients.flatMap(c =>
        c.user.animals.map(a => ({ ...a, ownerName: c.user.firstName + ' ' + (c.user.lastName || '') }))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 italic tracking-tight flex items-center gap-4">
                        <PawPrint className="w-10 h-10 text-primary" />
                        Base de Pacientes
                    </h2>
                    <p className="text-gray-400 font-medium italic mt-2">Gestiona el historial y hábitos de consumo de todas las mascotas registradas.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o dueño..."
                            className="bg-white border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Perros", val: animals.filter(a => a.species === "DOG").length, icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Gatos", val: animals.filter(a => a.species === "CAT").length, icon: HeartPulse, color: "text-rose-500", bg: "bg-rose-50" },
                    { label: "Otras especies", val: animals.filter(a => a.species !== "DOG" && a.species !== "CAT").length, icon: PawPrint, color: "text-orange-500", bg: "bg-orange-50" },
                ].map((stat, i) => (
                    <div key={i} className="card p-6 border-0 shadow-lg shadow-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.val}</p>
                        </div>
                        <div className={`${stat.bg} p-3 rounded-2xl ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Animals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {animals.map((animal) => (
                    <div key={animal.id} className="card p-8 border-0 shadow-2xl shadow-primary/5 rounded-[3.5rem] hover:shadow-primary/10 transition-all group border border-transparent hover:border-primary/10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-4 rounded-3xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <PawPrint className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic text-gray-900 leading-none mb-1">{animal.name}</h3>
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{animal.breed || animal.species}</span>
                                </div>
                            </div>
                            {animal.qrCode ? (
                                <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    #{animal.qrCode.shortCode}
                                </div>
                            ) : (
                                <div className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    Sin QR
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-sm">
                                <User className="w-4 h-4 text-primary" />
                                <span className="font-bold text-gray-600 italic">Dueño: <span className="text-gray-900">{animal.ownerName}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <HeartPulse className="w-4 h-4 text-rose-500" />
                                <span className="font-bold text-gray-600 italic">
                                    Vacuna:
                                    <span className="text-gray-900 ml-1">
                                        {animal.vaccinations[0] ? animal.vaccinations[0].name : "No registrada"}
                                    </span>
                                </span>
                            </div>
                            {(animal as any).foodBrand && (
                                <div className="flex items-center gap-3 text-sm">
                                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                                    <span className="font-bold text-gray-600 italic">Dieta: <span className="text-gray-900">{(animal as any).foodBrand}</span></span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-50">
                            <Link
                                href={`/vet/animals/${animal.id}?orgId=${activeOrgId}`}
                                className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-all"
                            >
                                Perfil Clínico <ChevronRight className="w-3 h-3" />
                            </Link>
                            <OrderRegistrationModal
                                animalId={animal.id}
                                animalName={animal.name}
                                currentFood={(animal as any).foodBrand}
                                orgId={activeOrgId}
                            />
                        </div>
                    </div>
                ))}

                {/* Add Mock Card */}
                <div className="card p-8 border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/20 transition-all opacity-60 hover:opacity-100">
                    <div className="bg-gray-50 p-6 rounded-full mb-6 group-hover:bg-primary/10 transition-all">
                        <Plus className="w-10 h-10 text-gray-300 group-hover:text-primary transition-all" />
                    </div>
                    <p className="text-gray-400 font-black italic text-lg group-hover:text-primary transition-all tracking-tight">Vincular Mascota</p>
                    <p className="text-xs text-gray-300 font-medium mt-1">Escanea un QR para asociarla a la clínica</p>
                </div>
            </div>
        </div>
    );
}
