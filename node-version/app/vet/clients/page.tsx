import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Users, Mail, Phone, Calendar, ArrowRight, PawPrint, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default async function VetClientsPage({ searchParams }: { searchParams: { orgId?: string } }) {
    const session = await auth();
    const userMemberships = await prisma.organizationMember.findMany({
        where: { userId: session?.user.id },
        include: { organization: true }
    });

    const activeOrgId = searchParams.orgId || userMemberships[0]?.organizationId;
    if (!activeOrgId) return <div>No autorizado</div>;

    // Fetch clients for this organization
    const clients = await prisma.organizationClient.findMany({
        where: { organizationId: activeOrgId, isActive: true },
        include: {
            user: {
                include: {
                    animals: { include: { qrCode: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 italic tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        CRM de Clientes
                    </h2>
                    <p className="text-gray-400 font-medium italic">Gestiona la base de datos de dueños de mascotas asociados a tu red de trabajo.</p>
                </div>
            </div>

            <div className="card overflow-hidden rounded-[3rem] border-0 shadow-2xl shadow-primary/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Cliente</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Contacto</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Mascotas Vinculadas</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Última Visita</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 text-lg">
                                                {client.user.firstName} {client.user.lastName}
                                                {!client.user.firstName && "Usuario #" + client.id.substring(0, 4)}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">ID: {client.id.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 text-primary" />
                                                {client.user.email}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                                <Phone className="w-3 h-3" />
                                                Sin Teléfono
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {client.user.animals.map((a) => (
                                                <div key={a.id} className="group relative">
                                                    <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-help shadow-sm">
                                                        <PawPrint className="w-4 h-4" />
                                                    </div>
                                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                        {a.name} {a.qrCode && `(#${a.qrCode.shortCode})`}
                                                    </span>
                                                </div>
                                            ))}
                                            {client.user.animals.length === 0 && (
                                                <span className="text-xs text-gray-300 italic">Sin mascotas</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Link
                                            href={`/vet/clients/${client.id}?orgId=${activeOrgId}`}
                                            className="inline-flex items-center gap-2 p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-primary hover:text-white transition-all active:scale-95 border border-gray-200"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Promotion Box */}
            <div className="bg-gradient-to-br from-blue-600 to-primary p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-3xl font-black mb-4 italic tracking-tight">Crecimiento de Red</h3>
                    <p className="text-blue-100 text-lg font-medium italic opacity-80 max-w-xl">
                        Cada vez que escaneas un código QR de Localipet en tu clínica, el cliente queda automáticamente vinculado a tu ERP si aún no tiene veterinario asignado.
                    </p>
                </div>
                <div className="bg-white text-primary p-10 rounded-[2.5rem] flex flex-col items-center gap-3 shadow-xl relative z-10 min-w-[280px]">
                    <ShoppingBag className="w-12 h-12" />
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Oportunidad:</p>
                    <p className="text-2xl font-black italic whitespace-nowrap">{(clients.length * 1.5).toFixed(0)} Ventas Mes</p>
                </div>
            </div>
        </div>
    );
}
