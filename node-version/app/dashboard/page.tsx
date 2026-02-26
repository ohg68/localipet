import { PawPrint, QrCode, MessageSquare, ShieldCheck, Plus, Eye, ChevronRight, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [animalsCount, recentScansCount, unreadMessages, activeConsents, animals] = await Promise.all([
        prisma.animal.count({ where: { ownerId: session.user.id, isActive: true } }),
        prisma.scanLog.count({ where: { qrCode: { animal: { ownerId: session.user.id } }, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        prisma.finderMessage.count({ where: { qrCode: { animal: { ownerId: session.user.id } }, isRead: false } }),
        prisma.animalCoOwner.count({ where: { userId: session.user.id } }),
        prisma.animal.findMany({
            where: { ownerId: session.user.id, isActive: true },
            include: { qrCode: true },
            take: 6,
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const stats = [
        { title: "Mascotas", value: animalsCount, icon: PawPrint, color: "from-blue-500 to-blue-600", shadow: "shadow-blue-200" },
        { title: "Escaneos (7d)", value: recentScansCount, icon: QrCode, color: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-200" },
        { title: "Mensajes", value: unreadMessages, icon: MessageSquare, color: "from-rose-500 to-rose-600", shadow: "shadow-rose-200" },
        { title: "Compartidos", value: activeConsents, icon: ShieldCheck, color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-200" },
    ];

    return (
        <div className="container pb-12">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                            Hola, <span className="text-primary italic">{session.user.name?.split(' ')[0]}</span>.
                        </h1>
                        <p className="text-gray-500 font-medium">Tienes {animalsCount} {animalsCount === 1 ? 'mascota registrada' : 'mascotas registradas'} en tu cuenta.</p>
                    </div>
                    <Link href="/animals/create" className="btn-primary py-3 px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-fit">
                        <Plus className="w-5 h-5" />
                        <span>Añadir nueva mascota</span>
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-2xl ${stat.shadow} shadow-lg flex flex-col items-start relative overflow-hidden group`}>
                        <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-125 transition-transform duration-500">
                            <stat.icon className="w-24 h-24" />
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl mb-4 backdrop-blur-md">
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-black mb-1">{stat.value}</div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80">{stat.title}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content: Animals */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Mascotas Recientes
                        </h2>
                        <Link href="/animals" className="text-primary font-bold text-sm flex items-center gap-1 hover:translate-x-1 transition-transform">
                            Ver todas <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {animals.length === 0 ? (
                            <div className="col-span-full card p-12 flex flex-col items-center text-center text-gray-400">
                                <PawPrint className="w-16 h-16 mb-4 opacity-10" />
                                <p className="mb-4">No tienes mascotas registradas aún.</p>
                                <Link href="/animals/create" className="text-primary font-bold">Comenzar ahora</Link>
                            </div>
                        ) : (
                            animals.map((animal: any) => (
                                <Link key={animal.id} href={`/animals/${animal.id}`} className="group relative">
                                    <div className={`card overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px] border-2 ${animal.isLost ? 'border-red-500 ring-4 ring-red-500/10' : 'border-transparent'}`}>
                                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                                            {animal.photo ? (
                                                <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <PawPrint className="w-12 h-12" />
                                                </div>
                                            )}
                                            {animal.isLost && (
                                                <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-lg">
                                                    Extraviado
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{animal.name}</h3>
                                            <p className="text-sm text-gray-500 font-medium capitalize">{animal.species.toLowerCase()} • {animal.breed || 'Sin raza'}</p>

                                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <QrCode className="w-4 h-4" />
                                                    {animal.qrCode?.token.substring(0, 8)}...
                                                </div>
                                                <div className="bg-primary/5 text-primary p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Activity/Tips */}
                <div className="space-y-8">
                    {unreadMessages > 0 && (
                        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                ¡Nuevos Mensajes!
                            </h3>
                            <p className="text-rose-700 text-sm mb-4">Tienes {unreadMessages} mensajes nuevos de personas que han escaneado a tus mascotas.</p>
                            <Link href="/messages" className="block text-center bg-rose-600 text-white py-2 rounded-xl font-bold text-sm shadow-md hover:bg-rose-700 transition-colors">
                                Revisar Bandeja
                            </Link>
                        </div>
                    )}

                    <div className="card p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Consejos de Seguridad
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg h-fit text-xs font-bold">01</div>
                                <p className="text-xs text-gray-600 leading-relaxed">Mantén siempre actualizado el <strong>ID del Microchip</strong> en la ficha de tu mascota.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg h-fit text-xs font-bold">02</div>
                                <p className="text-xs text-gray-600 leading-relaxed">Si sales de viaje, marca a tu mascota como <strong>"Preventivo"</strong> para alertas rápidas.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg h-fit text-xs font-bold">03</div>
                                <p className="text-xs text-gray-600 leading-relaxed">Verifica que tu <strong>teléfono de contacto</strong> esté al día en tu perfil.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-8 rounded-2xl relative overflow-hidden shadow-xl">
                        <Search className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10" />
                        <h3 className="text-xl font-black mb-2 italic">Localipet PRO</h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">Accede a geolocalización avanzada, historial médico completo y más funciones premium.</p>
                        <button className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                            Saber más
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
