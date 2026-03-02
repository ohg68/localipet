import { PawPrint, QrCode, MessageSquare, ShieldCheck, Plus, Eye, ChevronRight, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const locale = await getLocale();
    const t = translations[locale];

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
        { title: t.dashboard.stats.pets, value: animalsCount, icon: PawPrint, color: "from-blue-500 to-blue-600", shadow: "shadow-blue-200" },
        { title: t.dashboard.stats.scans, value: recentScansCount, icon: QrCode, color: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-200" },
        { title: t.dashboard.stats.messages, value: unreadMessages, icon: MessageSquare, color: "from-secondary to-secondary-hover", shadow: "shadow-secondary/20" },
        { title: t.dashboard.stats.shared, value: activeConsents, icon: ShieldCheck, color: "from-primary to-primary-hover", shadow: "shadow-primary/20" },
    ];

    return (
        <div className="container pb-12">
            <header className="mb-10 pt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                                {t.dashboard.greeting} <span className="text-primary italic">{session.user.name?.split(' ')[0]}</span>.
                            </h1>
                            <p className="text-gray-500 font-medium">
                                {t.dashboard.summary.replace("{count}", animalsCount.toString()).replace("{animal}", animalsCount === 1 ? t.dashboard.summaryAnimalSin : t.dashboard.summaryAnimalPlu)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/animals/create" className="btn-primary py-3 px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-fit">
                            <Plus className="w-5 h-5" />
                            <span>{t.dashboard.addNew}</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-[2rem] ${stat.shadow} shadow-lg flex flex-col items-start relative overflow-hidden group`}>
                        <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-125 transition-transform duration-500">
                            <stat.icon className="w-24 h-24" />
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl mb-4 backdrop-blur-md">
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-black mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">{stat.title}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content: Animals */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-1 w-8 bg-primary rounded-full"></div>
                            <h2 className="text-2xl font-black uppercase italic text-slate-900 tracking-tight">
                                {t.dashboard.recentPets}
                            </h2>
                        </div>
                        <Link href="/animals" className="text-primary font-black text-sm flex items-center gap-2 hover:translate-x-1 transition-transform uppercase tracking-widest">
                            {t.dashboard.viewAll} <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {animals.length === 0 ? (
                            <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-[3rem] flex flex-col items-center text-center text-slate-400">
                                <PawPrint className="w-20 h-20 mb-6 opacity-20" />
                                <p className="mb-6 font-bold text-lg">{t.dashboard.noPets}</p>
                                <Link href="/animals/create" className="bg-primary text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-primary/20">{t.dashboard.startNow}</Link>
                            </div>
                        ) : (
                            animals.map((animal: any) => (
                                <Link key={animal.id} href={`/animals/${animal.id}`} className="group relative">
                                    <div className={`bg-white rounded-[2.5rem] shadow-xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:translate-y-[-8px] border-2 ${animal.isLost ? 'border-red-500 ring-8 ring-red-500/5' : 'border-transparent'}`}>
                                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                                            {animal.photo ? (
                                                <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <PawPrint className="w-16 h-16" />
                                                </div>
                                            )}
                                            {animal.isLost && (
                                                <div className="absolute top-6 right-6 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] animate-pulse shadow-lg border border-red-400">
                                                    {t.dashboard.statusLost}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-8">
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors italic uppercase leading-none mb-3">{animal.name}</h3>
                                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">{locale === 'es' ? animal.species : (animal.species === 'DOG' ? t.scan.dog : t.scan.cat)} • {animal.breed || t.dashboard.noBreed}</p>

                                            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                                                    <QrCode className="w-4 h-4" />
                                                    {animal.qrCode?.token.substring(0, 8)}...
                                                </div>
                                                <div className="bg-slate-50 text-slate-400 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                    <ChevronRight className="w-6 h-6" />
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
                <div className="space-y-10 pt-16">
                    {unreadMessages > 0 && (
                        <div className="bg-secondary/5 border-2 border-secondary/10 p-8 rounded-[3rem] shadow-xl shadow-secondary/5">
                            <h3 className="font-black text-secondary flex items-center gap-3 mb-4 uppercase text-sm tracking-widest italic">
                                <AlertTriangle className="w-6 h-6" />
                                {t.dashboard.newMessages}
                            </h3>
                            <p className="text-secondary/80 font-bold mb-8 leading-relaxed italic">{t.dashboard.newMessagesDesc.replace("{count}", unreadMessages.toString())}</p>
                            <Link href="/messages" className="block text-center bg-secondary text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-lg shadow-secondary/20 hover:bg-secondary-hover transition-all active:scale-95">
                                {t.dashboard.checkInbox}
                            </Link>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50">
                        <h3 className="font-black text-slate-900 mb-8 flex items-center gap-4 uppercase text-sm tracking-widest italic leading-none">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                            {t.dashboard.securityTips}
                        </h3>
                        <div className="space-y-8">
                            {t.dashboard.tips.map((tip, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="bg-primary/5 text-primary w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-black group-hover:bg-primary group-hover:text-white transition-all">0{i + 1}</div>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed italic">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] relative overflow-hidden shadow-2xl border-b-8 border-slate-800">
                        <Search className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 pointer-events-none" />
                        <h3 className="text-3xl font-black mb-2 italic uppercase tracking-tight">{t.dashboard.proTitle}</h3>
                        <p className="text-sm text-slate-400 mb-10 leading-relaxed font-bold italic">{t.dashboard.proDesc}</p>
                        <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95">
                            {t.dashboard.knowMore}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
