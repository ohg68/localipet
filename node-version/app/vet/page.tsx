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
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

import VetDashboardAlerts from "@/components/VetDashboardAlerts";

export default async function VetDashboardPage() {
    const session = await auth();
    const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId: session?.user.id }
    });

    if (!orgMembership) {
        return (
            <div className="card p-12 text-center border-0 shadow-2xl bg-white rounded-[3rem]">
                <div className="bg-primary/10 p-8 rounded-full w-fit mx-auto mb-6">
                    <ShieldAlert className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 italic">Sin Organización Vinculada</h2>
                <p className="text-gray-500 font-medium max-w-md mx-auto italic mb-8">Debes estar vinculado a una clínica veterinaria para acceder al ERP.</p>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 max-w-sm mx-auto">
                    <p className="text-xs font-black uppercase text-gray-400 mb-2">Paso 1:</p>
                    <p className="text-sm font-bold text-gray-900 leading-relaxed">Pide que te inviten desde el Panel de Admin o registra tu propia clínica.</p>
                </div>
            </div>
        );
    }

    const data = await getVetDashboard(orgMembership.organizationId);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: "Clientes CRM", val: data.clientCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Mascotas", val: data.animalCount, icon: PawPrint, color: "text-primary", bg: "bg-primary/10" },
                    { title: "Alertas Activas", val: data.alerts.length, icon: BellRing, color: "text-rose-500", bg: "bg-rose-50" },
                    { title: "Conversión", val: "12%", icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
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
            <VetDashboardAlerts alerts={data.alerts as any} orgId={orgMembership.organizationId} />

            {/* Special Campaigns Manager Banner */}
            <div className="bg-gray-900 text-white p-12 rounded-[4rem] relative overflow-hidden text-center lg:text-left shadow-2xl shadow-gray-900/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                    <div className="lg:flex-1">
                        <h3 className="text-4xl font-black mb-4 italic tracking-tight">Potencia tus Ventas con Supervisión Humana</h3>
                        <p className="text-gray-400 text-lg font-medium italic mb-8 max-w-2xl leading-relaxed">
                            Las alertas automáticas pueden ser ignoradas. Un mensaje personalizado enviado por un profesional de confianza aumenta la conversión de visitas en un 40%.
                        </p>
                        <button className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <ShieldCheck className="w-6 h-6" /> Panel de Comunicaciones
                        </button>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-3xl w-full lg:w-96 text-center transform hover:rotate-1 transition-transform cursor-help">
                        <div className="bg-primary/20 w-fit p-4 rounded-3xl mx-auto mb-6">
                            <Zap className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 underline decoration-primary decoration-2 underline-offset-4">Dato Localipet:</p>
                        <p className="text-lg font-bold italic">El 85% de los dueños prefieren recibir recordatorios personalizados por WhatsApp.</p>
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
