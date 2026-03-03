import { getVetDashboard } from "@/app/actions/vet";
import {
    Users,
    PawPrint,
    MapPin,
    Calendar,
    Activity,
    ShieldCheck,
    ShieldAlert,
    BellRing,
    ShoppingBag,
    HeartPulse,
    Package
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import VetDashboardAlerts from "@/components/VetDashboardAlerts";

export default async function VetDashboardPage({ searchParams }: { searchParams: { orgId?: string } }) {
    const session = await auth();
    const userMemberships = await prisma.organizationMember.findMany({
        where: { userId: session?.user.id },
        include: { organization: true }
    });

    const locale = await getLocale();
    const t = translations[locale];

    // Determine the active organization
    const activeOrgId = searchParams.orgId || userMemberships[0]?.organizationId;
    const activeOrg = userMemberships.find(m => m.organizationId === activeOrgId)?.organization || userMemberships[0]?.organization;

    if (!activeOrg && session?.user.role !== "ADMIN") {
        return (
            <div className="card p-12 text-center border-0 shadow-2xl bg-white rounded-[3rem]">
                <div className="bg-primary/10 p-8 rounded-full w-fit mx-auto mb-6">
                    <ShieldAlert className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 italic">{t.vet.noOrgTitle}</h2>
                <p className="text-gray-500 font-medium max-w-md mx-auto italic mb-8">{t.vet.noOrgDesc}</p>
            </div>
        );
    }

    // Show workspace selector if user has more than one
    const showSelector = userMemberships.length > 1;

    const data = await getVetDashboard(activeOrg?.id || "");

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Quick Workspace Switcher (if needed) */}
            {showSelector && (
                <div className="flex items-center gap-4 bg-white w-fit p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
                    <p className="px-4 text-[10px] font-black uppercase text-gray-400">{t.vet.myClinics}</p>
                    {userMemberships.map((m) => (
                        <Link
                            key={m.organizationId}
                            href={`/vet?orgId=${m.organizationId}`}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeOrg?.id === m.organizationId
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-gray-400 hover:text-primary hover:bg-primary/5"
                                }`}
                        >
                            {m.organization.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* Dashboard Header */}
            <div>
                <h2 className="text-4xl font-black text-gray-900 italic tracking-tight uppercase">
                    {t.vet.dashboard} <span className="text-primary">{activeOrg?.name}</span>
                </h2>
                <p className="text-gray-400 font-bold italic mt-1">{t.vet.subtitle}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: t.vet.stats.clients, val: data.clientCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: t.vet.stats.pets, val: data.animalCount, icon: PawPrint, color: "text-primary", bg: "bg-primary/10" },
                    { title: t.vet.stats.alerts, val: data.alerts.length, icon: BellRing, color: "text-rose-500", bg: "bg-rose-50" },
                    { title: t.vet.stats.conversion, val: "12%", icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
                ].map((kpi, i) => (
                    <div key={i} className="card p-8 border-2 border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg shadow-gray-100/50 cursor-pointer active:scale-95">
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

            {/* Human-Supervised Alerts Engine */}
            <VetDashboardAlerts alerts={data.alerts as any} orgId={activeOrg?.id || ""} locale={locale} />

            {/* Special Campaigns Manager Banner */}
            <div className="bg-gray-900 text-white p-12 rounded-[4rem] relative overflow-hidden text-center lg:text-left shadow-2xl shadow-gray-900/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                    <div className="lg:flex-1">
                        <h3 className="text-4xl font-black mb-4 italic tracking-tight">{t.vet.proActive.title}</h3>
                        <p className="text-gray-400 text-lg font-medium italic mb-8 max-w-2xl leading-relaxed">
                            {t.vet.proActive.desc}
                        </p>
                        <button className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <ShieldCheck className="w-6 h-6" /> {t.vet.proActive.btn}
                        </button>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-3xl w-full lg:w-96 text-center transform hover:rotate-1 transition-transform cursor-help">
                        <div className="bg-primary/20 w-fit p-4 rounded-3xl mx-auto mb-6">
                            <Zap className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 underline decoration-primary decoration-2 underline-offset-4">Dato Localipet:</p>
                        <p className="text-lg font-bold italic">{t.vet.proActive.dataPoint}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


const Zap = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
