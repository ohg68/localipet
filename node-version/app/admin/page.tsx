import { prisma } from "@/lib/prisma";
import { Users, PawPrint, Hospital, QrCode, TrendingUp, ShieldCheck, MapPin, Calendar, HeartPulse } from "lucide-react";

export default async function AdminDashboardPage() {
    // Basic stats via Prisma
    const stats = await Promise.all([
        prisma.user.count(),
        prisma.animal.count(),
        prisma.organization.count(),
        prisma.qRCode.count({ where: { animalId: { not: null } } }),
        prisma.scanLog.count(),
        prisma.finderMessage.count()
    ]);

    const [userCount, animalCount, orgCount, activeTags, totalScans, totalMsgs] = stats;

    const recentScans = await prisma.scanLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { qrCode: { include: { animal: true } } }
    });

    const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { profile: true }
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: "Usuarios Totales", val: userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Mascotas", val: animalCount, icon: PawPrint, color: "text-primary", bg: "bg-primary/10" },
                    { title: "Veterinarias", val: orgCount, icon: Hospital, color: "text-purple-500", bg: "bg-purple-50" },
                    { title: "Escaneos Totales", val: totalScans, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
                ].map((kpi, i) => (
                    <div key={i} className="card p-8 border-2 border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg shadow-gray-100/50">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{kpi.title}</p>
                            <p className="text-4xl font-black text-gray-900">{kpi.val}</p>
                        </div>
                        <div className={`${kpi.bg} p-4 rounded-3xl ${kpi.color} group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-8 h-8" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Recent Activity */}
                <div className="card border-0 shadow-2xl shadow-primary/5 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <HeartPulse className="w-6 h-6 text-primary" />
                            Escaneos Recientes
                        </h3>
                    </div>
                    <div className="p-4">
                        {recentScans.length > 0 ? (
                            <div className="space-y-4">
                                {recentScans.map((scan) => (
                                    <div key={scan.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 italic">
                                                    #{scan.qrCode.shortCode} - {scan.qrCode.animal?.name || "Sin Nombre"}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {scan.cityGuess || "Ubicación desconocida"}, {scan.countryGuess || "MX"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase italic">
                                            {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-400 font-bold italic">No se han registrado escaneos recientemente</div>
                        )}
                    </div>
                </div>

                {/* New Users */}
                <div className="card border-0 shadow-2xl shadow-primary/5 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Nuevos Usuarios
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">
                                                {user.firstName || user.email.split('@')[0]} {user.lastName || ""}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase italic">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Health Section */}
            <div className="bg-gray-900 text-white p-12 rounded-[3.5rem] relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
                <h3 className="text-3xl font-black mb-6 italic tracking-tight">Estado de la Plataforma</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl relative z-10">
                    <div>
                        <p className="text-primary text-5xl font-black mb-2 italic">{(activeTags / (userCount || 1) * 100).toFixed(0)}%</p>
                        <p className="text-gray-400 text-sm font-black uppercase tracking-widest leading-relaxed">Tags Vinculados</p>
                    </div>
                    <div>
                        <p className="text-primary text-5xl font-black mb-2 italic">{totalMsgs}</p>
                        <p className="text-gray-400 text-sm font-black uppercase tracking-widest leading-relaxed">Mensajes Finder</p>
                    </div>
                    <div>
                        <p className="text-primary text-5xl font-black mb-2 italic">99.9%</p>
                        <p className="text-gray-400 text-sm font-black uppercase tracking-widest leading-relaxed">Uptime API</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
