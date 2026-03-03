import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
    BellRing,
    MessageSquare,
    Calendar,
    ShoppingBag,
    Mail,
    Send,
    CheckCircle2,
    Clock,
    TrendingUp,
    Plus,
    Zap,
    Tag
} from "lucide-react";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function VetCommunicationsPage() {
    const session = await auth();
    const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId: session?.user.id }
    });

    const locale = await getLocale();
    const t = translations[locale];

    if (!orgMembership) return <div>{t.vet.notAuthorized}</div>;

    const campaigns = await prisma.vetCampaign.findMany({
        where: { organizationId: orgMembership.organizationId },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-gray-900 italic tracking-tight flex items-center gap-4">
                        <BellRing className="w-10 h-10 text-primary" />
                        {t.vet.commsManager.title}
                    </h2>
                    <p className="text-gray-500 font-medium italic mt-2 text-lg">{t.vet.commsManager.description}</p>
                </div>
                <button className="btn-primary py-4 px-8 text-sm flex items-center justify-center gap-2 group transition-all">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> {t.vet.commsManager.newCampaign}
                </button>
            </div>

            {/* Smart Alarm Config */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: t.vet.commsManager.vaccines, status: t.vet.commsManager.statusActiveAuto, icon: Calendar, color: "text-rose-500", bg: "bg-rose-50" },
                    { label: t.vet.commsManager.food, status: t.vet.commsManager.statusActiveAI, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: t.vet.commsManager.grooming, status: t.vet.commsManager.statusManual, icon: Zap, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((alarm, i) => (
                    <div key={i} className="card p-8 border-2 border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-green-100 text-green-600 rounded-bl-xl text-[10px] font-black uppercase tracking-widest">{alarm.status}</div>
                        <div>
                            <p className="text-sm font-black text-gray-900 italic mb-2 tracking-tight">{t.vet.alerts.supervise} {alarm.label}</p>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.vet.commsManager.channelLabel}</span>
                        </div>
                        <div className={`${alarm.bg} p-4 rounded-3xl ${alarm.color}`}>
                            <alarm.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Active Campaigns List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black italic flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t.vet.commsManager.activeCampaigns}
                    </h3>

                    <div className="space-y-4">
                        {campaigns.length > 0 ? (
                            campaigns.map((c) => (
                                <div key={c.id} className="card p-8 border-0 shadow-2xl shadow-primary/5 rounded-[3rem] hover:shadow-primary/10 transition-shadow">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-2xl font-black italic text-gray-900 mb-1">{c.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">#{c.discountCode || "PROMO"}</span>
                                                <span className="text-xs text-gray-400 font-medium">{t.vet.commsManager.expires} {new Date(c.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 text-green-600 p-2 rounded-xl">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-gray-500 font-medium italic mb-8 leading-relaxed line-clamp-2">{c.description}</p>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500">
                                                    U{i}
                                                </div>
                                            ))}
                                            <div className="w-10 h-10 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black">
                                                +12
                                            </div>
                                        </div>
                                        <button className="btn-primary py-3 px-6 text-xs flex items-center gap-2">
                                            {t.vet.commsManager.viewMetrics} <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="card p-16 text-center border-dashed border-4 border-gray-100 rounded-[3rem]">
                                <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold italic">{t.vet.commsManager.noCampaigns}</p>
                                <p className="text-xs text-gray-300 font-medium mt-2">{t.vet.commsManager.noCampaignsDesc}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Automation Log */}
                <div className="card border-0 shadow-2xl shadow-primary/5 rounded-[3.5rem] overflow-hidden self-start">
                    <div className="p-10 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-black italic flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" />
                            {t.vet.commsManager.recentActivity}
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {[
                            { user: "Carlos C.", msg: "Alarma Vacuna Enviada", time: `10m ${t.vet.commsManager.ago}`, icon: Mail, bg: "bg-rose-50" },
                            { user: "Ana R.", msg: "Oferta Alimento Recibida", time: `1h ${t.vet.commsManager.ago}`, icon: Send, bg: "bg-blue-50" },
                            { user: "Max (DOG)", msg: "Recordatorio Agendado", time: `2h ${t.vet.commsManager.ago}`, icon: MessageSquare, bg: "bg-purple-50" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className={`${log.bg} p-3 rounded-2xl flex-shrink-0`}>
                                    <log.icon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-gray-900 italic truncate">{log.user}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{log.msg}</p>
                                </div>
                                <span className="text-[10px] font-black text-gray-300 italic whitespace-nowrap">{log.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);
