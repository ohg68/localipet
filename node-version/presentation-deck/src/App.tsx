import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    Target,
    Zap,
    Globe,
    Smartphone,
    Hospital,
    ArrowRight,
    ShieldAlert,
    Database,
    Search,
    CheckCircle2,
    TrendingUp,
    Cpu,
    Layers,
    Languages
} from "lucide-react";

const translations: any = {
    es: {
        pitch: "PITCH",
        valueProp: "Propuesta de Valor 2026",
        nav: { prev: "Anterior", next: "Siguiente" },
        slides: [
            {
                type: "hero",
                title: "LOCALIPET",
                subtitle: "El Ecosistema de Protección Animal Inteligente",
                description: "Digitalizando la industria del Pet-Care con Hardware QR y Predicción Clínica.",
                image: "/hero_new.png"
            },
            {
                type: "problem",
                title: "El Desafío Actual",
                subtitle: "Mercados reactivos vs Necesidad proactiva",
                points: [
                    { title: "Pérdida Crítica", desc: "El miedo a perder a una mascota y no poder recuperarla rápidamente.", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
                    { title: "Baja Fidelización", desc: "Clínicas veterinarias operando de forma reactiva, perdiendo el 60% de las ventas de reposición.", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Data Fragmentada", desc: "Información médica en papel o silos digitales inconexos.", icon: Database, color: "text-amber-500", bg: "bg-amber-50" }
                ]
            },
            {
                type: "solution",
                title: "Nuestra Solución Integradora",
                subtitle: "Una sola plataforma, tres mundos conectados.",
                items: [
                    { title: "Smart Tags", desc: "Hardware físico con geolocalización pasiva.", icon: Smartphone },
                    { title: "Vet ERP", desc: "Software clínico multi-sede profesional.", icon: Hospital },
                    { title: "Smart Alarms", desc: "Algoritmos predictivos de consumo.", icon: Zap }
                ]
            },
            {
                type: "feature",
                title: "Protección B2C: Smart QR",
                image: "/how-it-works.png",
                description: "Sin suscripciones, sin apps. Cualquier smartphone lee el código y envía la ubicación GPS exacta al dueño de inmediato.",
                benefits: ["GPS Pasivo Universal", "Perfil Médico de Emergencia", "Notificación WhatsApp Instantánea"]
            },
            {
                type: "erp",
                title: "Vet Connect: El ERP Corporativo",
                points: [
                    "Gestión multi-clínica descentralizada para grandes cadenas.",
                    "CRM detallado con historial de consumo real por mascota.",
                    "Control de stock automático basado en la demanda futura."
                ],
                image: "/erp_new.png"
            },
            {
                type: "predictive",
                title: "Inteligencia Predictiva",
                subtitle: "Vender antes de que se agote.",
                points: [
                    { label: "Análisis", val: "Tasa de consumo diario" },
                    { label: "Predicción", val: "Cálculo de agote" },
                    { label: "Acción", val: "Alerta automática al dueño" }
                ],
                summary: "Convertimos una necesidad reactiva en una venta recurrente garantizada.",
                impact: "+40% en Retención"
            },
            {
                type: "business",
                title: "Modelo de Negocio",
                models: [
                    { name: "Hardware", type: "Venta directa de Tags & Accesorios", pct: "30%", icon: Cpu },
                    { name: "SaaS", type: "Suscripción mensual por clínica (ERP)", pct: "40%", icon: Hospital },
                    { name: "Marketplace", type: "Comisión por reposición dirigida", pct: "30%", icon: ArrowRight }
                ]
            },
            {
                type: "stack",
                title: "Sólidez Tecnológica",
                stack: [
                    { name: "Next.js", icon: Globe },
                    { name: "PostgreSQL", icon: Database },
                    { name: "Prisma", icon: Layers },
                    { name: "Auth.js", icon: Target },
                    { name: "Vercel", icon: Zap }
                ],
                description: "Infraestructura Cloud-Native diseñada para la escala global y alta disponibilidad de datos críticos."
            },
            {
                type: "vision",
                title: "Hacia el Data-Driven Pet Care",
                future: ["Big Data de salud preventiva global", "Red de emergencias interconectada", "Sinergia con seguros de salud animal"]
            },
            {
                type: "last",
                title: "Localipet",
                subtitle: "Donde la tecnología encuentra el amor por las mascotas.",
                contact: "osvaldo.guevara@localipet.com",
                cta: "Prueba el sistema en vivo"
            }
        ]
    },
    pt: {
        pitch: "APRESENTAÇÃO",
        valueProp: "Proposta de Valor 2026",
        nav: { prev: "Anterior", next: "Próximo" },
        slides: [
            {
                type: "hero",
                title: "LOCALIPET",
                subtitle: "O Ecossistema de Proteção Animal Inteligente",
                description: "Digitalizando a indústria de Pet-Care com Hardware QR e Predição Clínica.",
                image: "/hero_new.png"
            },
            {
                type: "problem",
                title: "O Desafio Atual",
                subtitle: "Mercados reativos vs Necessidade proativa",
                points: [
                    { title: "Perda Crítica", desc: "O receio de perder um animal de estimação e não conseguir recuperá-lo rapidamente.", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
                    { title: "Baixa Fidelização", desc: "Clínicas veterinárias operando de forma reativa, perdendo 60% das vendas de reposição.", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Dados Fragmentados", desc: "Informações médicas em papel ou silos digitais desconexos.", icon: Database, color: "text-amber-500", bg: "bg-amber-50" }
                ]
            },
            {
                type: "solution",
                title: "Nossa Solução Integradora",
                subtitle: "Uma única plataforma, três mundos conectados.",
                items: [
                    { title: "Smart Tags", desc: "Hardware físico com geolocalização passiva.", icon: Smartphone },
                    { title: "Vet ERP", desc: "Software clínico multisede profissional.", icon: Hospital },
                    { title: "Smart Alarms", desc: "Algoritmos preditivos de consumo.", icon: Zap }
                ]
            },
            {
                type: "feature",
                title: "Proteção B2C: Smart QR",
                image: "/how-it-works.png",
                description: "Sem assinaturas, sem aplicações. Qualquer smartphone lê o código e envia a localização GPS exata ao tutor imediatamente.",
                benefits: ["GPS Passivo Universal", "Perfil Médico de Emergência", "Notificação WhatsApp Instantânea"]
            },
            {
                type: "erp",
                title: "Vet Connect: O ERP Corporativo",
                points: [
                    "Gestão multiclínica descentralizada para grandes cadeias.",
                    "CRM detalhado com histórico de consumo real por animal.",
                    "Controle de stock automático baseado na procura futura."
                ],
                image: "/erp_new.png"
            },
            {
                type: "predictive",
                title: "Inteligência Preditiva",
                subtitle: "Vender antes que se esgote.",
                points: [
                    { label: "Análise", val: "Taxa de consumo diário" },
                    { label: "Predição", val: "Cálculo de rutura" },
                    { label: "Ação", val: "Alerta automático ao tutor" }
                ],
                summary: "Convertemos uma necessidade reativa numa venda recorrente garantida.",
                impact: "+40% em Retenção"
            },
            {
                type: "business",
                title: "Modelo de Negócio",
                models: [
                    { name: "Hardware", type: "Venda direta de Tags e Acessórios", pct: "30%", icon: Cpu },
                    { name: "SaaS", type: "Assinatura mensal por clínica (ERP)", pct: "40%", icon: Hospital },
                    { name: "Marketplace", type: "Comissão por reposição direcionada", pct: "30%", icon: ArrowRight }
                ]
            },
            {
                type: "stack",
                title: "Solidez Tecnológica",
                stack: [
                    { name: "Next.js", icon: Globe },
                    { name: "PostgreSQL", icon: Database },
                    { name: "Prisma", icon: Layers },
                    { name: "Auth.js", icon: Target },
                    { name: "Vercel", icon: Zap }
                ],
                description: "Infraestrutura Cloud-Native desenhada para escala global e alta disponibilidade de dados críticos."
            },
            {
                type: "vision",
                title: "Rumo ao Data-Driven Pet Care",
                future: ["Big Data de saúde preventiva global", "Rede de emergências interconectada", "Sinergia com seguros de saúde animal"]
            },
            {
                type: "last",
                title: "Localipet",
                subtitle: "Onde a tecnologia encontra o amor pelos animais.",
                contact: "osvaldo.guevara@localipet.com",
                cta: "Teste o sistema em tempo real"
            }
        ]
    }
};

function App() {
    const [lang, setLang] = useState("es");
    const [current, setCurrent] = useState(0);

    const t = translations[lang];
    const slides = t.slides;

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    useEffect(() => {
        const handleKeyDown = (e: any) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const slide = slides[current];

    return (
        <main className="h-screen w-full bg-slate-50 flex items-center justify-center p-4 lg:p-12 relative overflow-hidden font-sans">

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-[#36C1BD]/5 -z-10 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-[#EB1B6B]/5 -z-10 blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4"></div>

            {/* Header / Nav */}
            <div className="absolute top-10 left-12 flex items-center gap-4 z-50">
                <div className="bg-[#36C1BD] p-2.5 rounded-2xl text-white shadow-lg shadow-[#36C1BD]/20 animate-pulse">
                    <Target className="w-6 h-6" />
                </div>
                <span className="font-black italic text-2xl tracking-tighter text-slate-900">
                    LOCALIPET <span className="text-[#36C1BD] uppercase">{t.pitch}</span>
                </span>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-10 right-32 flex bg-white/50 backdrop-blur rounded-2xl p-1 border border-white shadow-sm z-50">
                <button
                    onClick={() => setLang("es")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === "es" ? "bg-[#36C1BD] text-white shadow-lg shadow-[#36C1BD]/20" : "text-slate-400 hover:text-slate-600"}`}
                >
                    ES
                </button>
                <button
                    onClick={() => setLang("pt")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === "pt" ? "bg-[#36C1BD] text-white shadow-lg shadow-[#36C1BD]/20" : "text-slate-400 hover:text-slate-600"}`}
                >
                    PT
                </button>
            </div>

            <div className="absolute top-10 right-12 text-slate-400 font-black text-sm tracking-widest z-50">
                {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${lang}-${current}`}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/80 backdrop-blur-xl w-full max-w-7xl h-[85vh] rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex border border-white overflow-hidden relative"
                >
                    {slide.type === "hero" && (
                        <div className="flex flex-col lg:flex-row w-full h-full">
                            <div className="flex-1 p-12 lg:p-24 flex flex-col justify-center relative z-10">
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                    <div className="bg-[#36C1BD]/10 text-[#36C1BD] px-4 py-2 rounded-full w-fit font-black text-xs uppercase tracking-widest mb-10">
                                        {t.valueProp}
                                    </div>
                                    <h1 className="text-8xl lg:text-[10rem] font-black text-slate-900 italic mb-4 leading-[0.85] tracking-tighter">
                                        {slide.title}
                                    </h1>
                                    <h2 className="text-3xl lg:text-4xl font-black text-[#36C1BD] mb-10 italic leading-tight">
                                        {slide.subtitle}
                                    </h2>
                                    <p className="text-slate-500 text-xl lg:text-2xl font-medium max-w-lg leading-relaxed border-l-8 border-[#36C1BD]/20 pl-8">
                                        {slide.description}
                                    </p>
                                </motion.div>
                            </div>
                            <div className="flex-1 relative bg-slate-100 overflow-hidden">
                                <motion.div
                                    initial={{ scale: 1.1, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 1.2 }}
                                    className="h-full w-full"
                                >
                                    <img src={slide.image} alt="Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent"></div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {slide.type === "problem" && (
                        <div className="p-16 lg:p-24 w-full flex flex-col">
                            <div className="mb-16">
                                <h2 className="text-6xl font-black text-slate-900 italic mb-4 leading-tight">{slide.title}</h2>
                                <p className="text-2xl text-[#36C1BD] font-bold italic">{slide.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 flex-1">
                                {slide.points?.map((p: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 * i }}
                                        className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-2xl transition-all"
                                    >
                                        <div className={`p-8 ${p.bg} rounded-[2.5rem] mb-10 group-hover:scale-110 transition-transform`}>
                                            <p.icon className={`w-14 h-14 ${p.color}`} />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 italic mb-6 leading-tight">{p.title}</h3>
                                        <p className="text-slate-400 font-bold text-lg leading-relaxed">{p.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {slide.type === "solution" && (
                        <div className="p-16 lg:p-24 w-full flex flex-col items-center justify-center relative">
                            <div className="text-center max-w-4xl mb-24 relative z-10">
                                <h2 className="text-7xl font-black text-slate-900 italic mb-6 leading-none">{slide.title}</h2>
                                <div className="h-2 w-32 bg-[#36C1BD] mx-auto mb-8 rounded-full"></div>
                                <p className="text-3xl text-slate-500 font-bold italic">{slide.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full relative z-10">
                                {slide.items?.map((item: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -10 }}
                                        className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-50 flex flex-col items-center text-center group"
                                    >
                                        <div className="w-24 h-24 bg-[#36C1BD] text-white rounded-[2rem] flex items-center justify-center mb-10 shadow-lg shadow-[#36C1BD]/40 group-hover:rotate-6 transition-all">
                                            <item.icon className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-3xl font-black italic mb-4">{item.title}</h3>
                                        <div className="bg-[#36C1BD]/10 text-[#36C1BD] px-4 py-1 rounded-full text-xs font-black mb-6 uppercase tracking-widest leading-none">Pilar {i + 1}</div>
                                        <p className="text-slate-400 font-bold text-lg">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-100 -z-0"></div>
                        </div>
                    )}

                    {slide.type === "feature" && (
                        <div className="flex flex-col lg:flex-row w-full h-full">
                            <div className="flex-1 p-16 lg:p-24 flex flex-col justify-center">
                                <h2 className="text-6xl font-black text-slate-900 italic mb-10 uppercase leading-none">{slide.title}</h2>
                                <p className="text-2xl text-slate-500 font-bold leading-relaxed italic mb-12 max-w-lg border-l-8 border-[#36C1BD] pl-10">
                                    {slide.description}
                                </p>
                                <div className="space-y-6">
                                    {slide.benefits?.map((b: string, i: number) => (
                                        <div key={i} className="flex items-center gap-6">
                                            <CheckCircle2 className="w-8 h-8 text-[#36C1BD] flex-shrink-0" />
                                            <span className="text-xl font-black text-slate-700 italic">{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-[#36C1BD]/5 p-16 flex items-center justify-center">
                                <div className="relative w-full h-full bg-white rounded-[4rem] shadow-inner overflow-hidden flex items-center justify-center p-10 border-8 border-white">
                                    <img src={slide.image} alt="Feature" className="max-w-full max-h-full object-contain" />
                                    <div className="absolute top-10 right-10 bg-[#36C1BD] text-white p-6 rounded-full animate-bounce">
                                        <Smartphone className="w-10 h-10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {slide.type === "erp" && (
                        <div className="flex flex-col lg:flex-row w-full h-full">
                            <div className="flex-1 bg-slate-900 p-12 lg:p-20 relative flex items-center justify-center">
                                <img src={slide.image} alt="ERP Dashboard" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl scale-110" />
                                <div className="absolute inset-0 bg-[#36C1BD]/10 pointer-events-none"></div>
                            </div>
                            <div className="flex-1 p-16 lg:p-24 flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-1 w-12 bg-[#36C1BD]"></div>
                                    <span className="text-[#36C1BD] font-black uppercase text-sm tracking-widest italic">Core Technology</span>
                                </div>
                                <h2 className="text-6xl font-black text-slate-900 italic mb-12 uppercase leading-none">{slide.title}</h2>
                                <div className="space-y-10">
                                    {slide.points?.map((p: string, i: number) => (
                                        <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * i }} className="flex gap-8 items-start">
                                            <div className="bg-[#36C1BD] text-white p-2 rounded-2xl shadow-lg shadow-[#36C1BD]/20"><ChevronRight className="w-6 h-6" /></div>
                                            <p className="text-slate-600 font-black text-2xl italic leading-tight">{p}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {slide.type === "predictive" && (
                        <div className="p-16 lg:p-24 w-full flex flex-col justify-center overflow-hidden">
                            <div className="flex flex-col lg:flex-row gap-20 items-center">
                                <div className="flex-1">
                                    <h2 className="text-7xl font-black text-slate-900 italic mb-6 leading-none">{slide.title}</h2>
                                    <p className="text-4xl text-[#36C1BD] font-black italic mb-12">{slide.subtitle}</p>
                                    <p className="text-2xl text-slate-400 font-bold leading-relaxed mb-16 max-w-xl italic">
                                        {slide.summary}
                                    </p>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-1 gap-6">
                                    {slide.points?.map((p: any, i: number) => (
                                        <div key={i} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-[#36C1BD] transition-all">
                                            <div>
                                                <p className="text-sm font-black uppercase text-slate-400 group-hover:text-white/60 mb-2">{p.label}</p>
                                                <p className="text-4xl font-black italic group-hover:text-white">{p.val}</p>
                                            </div>
                                            <Search className="w-12 h-12 text-[#36C1BD]/40 group-hover:text-white" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-20 bg-slate-900 p-12 rounded-[3rem] flex items-center justify-between w-full">
                                <div className="flex items-center gap-10">
                                    <div className="w-20 h-20 bg-[#36C1BD] rounded-full flex items-center justify-center animate-pulse">
                                        <Zap className="w-10 h-10 text-white" />
                                    </div>
                                    <p className="text-white text-4xl font-black italic">{lang === 'es' ? 'Impacto en negocio:' : 'Impacto no negócio:'}</p>
                                </div>
                                <p className="text-[#36C1BD] font-black text-7xl italic leading-none">{slide.impact}</p>
                            </div>
                        </div>
                    )}

                    {slide.type === "business" && (
                        <div className="p-16 lg:p-24 w-full">
                            <h2 className="text-7xl font-black text-slate-900 italic mb-20 leading-none">{slide.title}</h2>
                            <div className="grid grid-cols-1 gap-8">
                                {slide.models?.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-12 bg-slate-50/50 rounded-[3.5rem] group hover:bg-[#36C1BD] transition-all shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-12">
                                            <div className="text-7xl font-black italic text-[#36C1BD] group-hover:text-white transition-colors">{m.pct}</div>
                                            <div className="w-1 h-20 bg-[#36C1BD10] group-hover:hidden"></div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <m.icon className="w-6 h-6 text-[#36C1BD] group-hover:text-white" />
                                                    <h4 className="text-4xl font-black text-slate-900 group-hover:text-white italic leading-none">{m.name}</h4>
                                                </div>
                                                <p className="text-slate-400 font-bold text-xl group-hover:text-white/60 italic">{m.type}</p>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:bg-transparent border-2 border-slate-100 group-hover:border-white transition-all">
                                            <ArrowRight className="w-10 h-10 text-slate-300 group-hover:text-white group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {slide.type === "stack" && (
                        <div className="p-16 lg:p-24 w-full flex flex-col justify-center text-center items-center">
                            <h2 className="text-7xl font-black text-slate-900 italic mb-4 leading-none">{slide.title}</h2>
                            <p className="text-2xl text-[#36C1BD] font-bold mb-20 italic">{lang === 'es' ? 'Infraestructura Corporativa Robusta' : 'Infraestrutura Corporativa Robusta'}</p>
                            <div className="flex flex-wrap justify-center gap-10 mb-20">
                                {slide.stack?.map((s: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="px-10 py-8 bg-slate-900 text-white rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl shadow-slate-900/40 border border-slate-700"
                                    >
                                        <s.icon className="w-10 h-10 text-[#36C1BD]" />
                                        <span className="font-black italic text-3xl">{s.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="text-2xl text-slate-400 font-bold italic max-w-3xl border-t border-slate-100 pt-16 leading-relaxed">
                                {slide.description}
                            </p>
                        </div>
                    )}

                    {slide.type === "vision" && (
                        <div className="p-16 lg:p-24 w-full flex flex-col justify-center relative items-center text-center">
                            <div className="max-w-5xl relative z-10">
                                <h2 className="text-9xl font-black text-slate-900 italic mb-20 leading-[0.85] tracking-tighter">
                                    {slide.title}
                                </h2>
                                <div className="flex flex-col gap-12 items-center">
                                    {slide.future?.map((f: string, i: number) => (
                                        <div key={i} className="flex items-center gap-10 group cursor-default">
                                            <div className="w-6 h-6 bg-[#36C1BD] rounded-full animate-ping"></div>
                                            <p className="text-5xl font-black italic text-slate-600 group-hover:text-[#36C1BD] transition-colors uppercase tracking-tight">{f}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute opacity-[0.03] scale-150 pointer-events-none">
                                <Globe className="w-[800px] h-[800px] text-slate-900" />
                            </div>
                        </div>
                    )}

                    {slide.type === "last" && (
                        <div className="w-full h-full flex flex-col lg:flex-row">
                            <div className="flex-1 p-16 lg:p-24 flex flex-col justify-center">
                                <div className="bg-[#36C1BD] w-24 h-4 mb-8 rounded-full"></div>
                                <h2 className="text-[10rem] font-black text-slate-900 italic mb-4 leading-none tracking-tighter">{slide.title}</h2>
                                <p className="text-4xl text-[#36C1BD] font-black italic mb-16">{slide.subtitle}</p>
                                <div className="p-12 bg-slate-50/50 rounded-[3.5rem] border border-slate-100 mb-16 group hover:border-[#36C1BD]/30 transition-colors">
                                    <p className="text-sm font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">{lang === 'es' ? 'Contacto Ejecutivo:' : 'Contacto Executivo:'}</p>
                                    <p className="text-4xl font-black italic text-slate-800">{slide.contact}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-primary w-fit text-2xl py-8 px-16 uppercase tracking-[0.1em] shadow-[0_20px_40px_-10px_rgba(54,193,189,0.4)]"
                                >
                                    {slide.cta}
                                </motion.button>
                            </div>
                            <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[#36C1BD] opacity-20 mix-blend-overlay"></div>
                                <Target className="w-96 h-96 text-[#36C1BD] opacity-40 animate-pulse" />
                                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#36C1BD]/20 blur-[100px] rounded-full"></div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute bottom-16 right-20 flex gap-6 z-50">
                <button
                    onClick={prev}
                    className="p-8 bg-white/80 backdrop-blur rounded-[2rem] border border-slate-100 shadow-xl hover:bg-white transition-all active:scale-95 group"
                >
                    <ChevronLeft className="w-10 h-10 text-slate-900 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={next}
                    className="p-8 bg-[#36C1BD] rounded-[2rem] shadow-2xl shadow-[#36C1BD]/40 hover:bg-[#2DA8A4] transition-all active:scale-95 text-white group"
                >
                    <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="absolute bottom-12 left-12 text-slate-400 font-black italic text-sm uppercase tracking-[0.3em]">
                Localipet v1.0 • {lang === 'es' ? 'Exclusive Private View' : 'Visualização Privada Exclusiva'} • Strategic Vision 2026
            </div>
        </main>
    );
}

export default App;
