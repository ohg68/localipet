import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
    ShoppingBag,
    TrendingUp,
    Package,
    User,
    Calendar,
    ArrowUpRight,
    Search,
    CheckCircle2,
    Clock,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";

export default async function VetInventoryPage({ searchParams }: { searchParams: { orgId?: string } }) {
    const session = await auth();
    const userMemberships = await prisma.organizationMember.findMany({
        where: { userId: session?.user.id },
        include: { organization: true }
    });

    const activeOrg = userMemberships.find(m => m.organizationId === searchParams.orgId) || userMemberships[0];

    if (!activeOrg) return <div>No autorizado</div>;

    const orgId = activeOrg.organizationId;

    // Fetch recent sales (OrganizationSale)
    const recentSales = await prisma.organizationSale.findMany({
        where: { organizationId: orgId },
        include: {
            client: { include: { user: true } },
            soldBy: true,
            order: { include: { items: { include: { product: true } } } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    });

    // Mock stats for inventory (these could be dynamic if we had a full inventory system)
    const totalSales = recentSales.length;
    const pendingAlerts = await (prisma.animal as any).count({
        where: {
            owner: { orgClientMemberships: { some: { organizationId: orgId } } },
            // Simplified logic for "needs food"
            lastFoodPurchaseDate: { lte: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }
        }
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 italic tracking-tight flex items-center gap-4">
                        <ShoppingBag className="w-10 h-10 text-primary" />
                        Ventas & Inventario
                    </h2>
                    <p className="text-gray-400 font-medium italic mt-2">Control de ingresos y trazabilidad de productos para {activeOrg.organization.name}.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Ventas Registradas", val: totalSales, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Stock Crítico (Alarmas)", val: pendingAlerts, icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "Conversión de Alarmas", val: "85%", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                ].map((kpi, i) => (
                    <div key={i} className="card p-8 border-0 shadow-xl shadow-primary/5 flex items-center justify-between rounded-[3rem]">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{kpi.label}</p>
                            <p className="text-4xl font-black text-gray-900 leading-none">{kpi.val}</p>
                        </div>
                        <div className={`${kpi.bg} p-5 rounded-[2rem] ${kpi.color}`}>
                            <kpi.icon className="w-10 h-10" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Sales Table */}
            <div className="card border-0 shadow-2xl shadow-primary/5 rounded-[3.5rem] overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <h3 className="text-2xl font-black italic flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        Registro de Ventas
                    </h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar venta..."
                            className="bg-white border-2 border-gray-100 rounded-3xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                </div>

                {recentSales.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente / Mascota</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">ID Orden</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Monto</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentSales.map((sale) => (
                                    <tr key={sale.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 italic">{sale.client?.user.firstName} {sale.client?.user.lastName}</p>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                                        {sale.client?.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-500 shadow-sm">
                                                #{sale.order.id.slice(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-lg font-black text-gray-900 leading-none">
                                                ${Number(sale.order.total).toLocaleString()}
                                                <span className="text-[10px] text-gray-400 ml-1 italic font-medium">{sale.order.currency}</span>
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 italic">
                                                <Calendar className="w-3 h-3 text-primary/50" />
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-3 bg-white border border-gray-100 rounded-2xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-32 text-center">
                        <div className="bg-gray-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                            <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-2xl font-black italic text-gray-300">No hay ventas registradas aún</p>
                        <p className="text-sm text-gray-400 font-bold mt-2">Usa el botón de "Venta" en las fichas de mascota para empezar.</p>
                    </div>
                )}
            </div>

            {/* Smart Inventory Banner */}
            <div className="bg-gray-900 text-white p-16 rounded-[4rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full -mr-64 -mt-64"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="bg-primary/20 text-primary px-4 py-2 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Inteligencia Predictiva Localipet
                    </div>
                    <h3 className="text-4xl font-black mb-6 italic tracking-tight">Sincroniza tus Pedidos con el Consumo</h3>
                    <p className="text-gray-400 text-lg font-bold leading-relaxed italic">
                        Localipet analiza en tiempo real cuánto alimento le queda a cada uno de tus pacientes. Optimiza tus pedidos a proveedores basándote en la <span className="text-white italic">demanda próxima real</span>, no en suposiciones.
                    </p>
                </div>
                <div className="relative z-10 bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 w-full lg:w-96 text-center shadow-2xl">
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-6">Alarmas de Stock</p>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold italic text-gray-300">Demanda Estimada (30d)</span>
                            <span className="text-xl font-black italic text-white">+120Kg</span>
                        </div>
                        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-primary h-full w-[85%]" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 italic">Conversión basada en hábitos registrados</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
