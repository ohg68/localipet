import Link from "next/link";
import {
    QrCode,
    Smartphone,
    MapPin,
    Bell,
    ShieldCheck,
    Heart,
    ArrowRight,
    UserPlus,
    CheckCircle2,
    HeartPulse
} from "lucide-react";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function AboutPage() {
    const locale = await getLocale();
    const t = translations[locale];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden bg-slate-50">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <QrCode className="w-full h-full -mr-20" />
                </div>
                <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-primary/20">
                            <HeartPulse className="w-4 h-4" />
                            <span>Explora Localipet</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8 italic uppercase">
                            {t.about.title.split('Localipet')[0]}<span className="text-primary underline decoration-8 underline-offset-8">Localipet</span>?
                        </h1>
                        <p className="text-xl text-slate-400 font-bold leading-relaxed mb-12 italic">
                            {t.about.subtitle}
                        </p>
                        <div className="flex justify-center gap-6">
                            <Link href="/register" className="bg-slate-900 text-white py-5 px-10 rounded-[1.5rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-b-8 border-slate-950">
                                {t.about.cta}
                                <ArrowRight className="w-6 h-6 text-primary" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Illustration Section */}
            <section className="py-24">
                <div className="container">
                    <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-50 flex flex-col lg:flex-row items-center">
                        <div className="lg:w-1/2 p-12 lg:p-24 bg-slate-50/30">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <img
                                    src={locale === 'es' ? "/how-it-works-es.png" : "/how-it-works-es.png"} // Assuming same for now or handle pt version
                                    alt="Identificación Localipet"
                                    className="relative w-full h-auto rounded-[2rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-12 lg:p-24 self-stretch flex flex-col justify-center">
                            <h2 className="text-4xl font-black text-slate-900 mb-12 tracking-tight italic uppercase">{t.about.powerTitle}</h2>
                            <div className="space-y-10">
                                {[
                                    {
                                        icon: Smartphone,
                                        title: t.about.steps[0].title,
                                        desc: t.about.steps[0].desc
                                    },
                                    {
                                        icon: MapPin,
                                        title: t.about.steps[1].title,
                                        desc: t.about.steps[1].desc
                                    },
                                    {
                                        icon: Bell,
                                        title: t.about.steps[2].title,
                                        desc: t.about.steps[2].desc
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="bg-slate-50 p-4 rounded-2xl shadow-sm text-primary flex-shrink-0 h-fit group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <item.icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic leading-none">{item.title}</h3>
                                            <p className="text-slate-400 font-bold leading-relaxed italic">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step by Step Section */}
            <section className="py-32 bg-slate-50/50">
                <div className="container">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter">{t.about.routeTitle}</h2>
                        <p className="text-xl text-slate-400 font-bold max-w-2xl mx-auto italic">{t.about.routeSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative">
                        {[
                            {
                                step: "01",
                                icon: UserPlus,
                                title: t.about.routeItems[0].title,
                                desc: t.about.routeItems[0].desc
                            },
                            {
                                step: "02",
                                icon: QrCode,
                                title: t.about.routeItems[1].title,
                                desc: t.about.routeItems[1].desc
                            },
                            {
                                step: "03",
                                icon: MapPin,
                                title: t.about.routeItems[2].title,
                                desc: t.about.routeItems[2].desc
                            },
                            {
                                step: "04",
                                icon: Heart,
                                title: t.about.routeItems[3].title,
                                desc: t.about.routeItems[3].desc
                            }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="bg-white border-8 border-slate-100 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl group-hover:border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative">
                                    <span className="absolute -top-4 -right-4 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full">{step.step}</span>
                                    <step.icon className="w-12 h-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase italic leading-none">{step.title}</h3>
                                <p className="text-slate-400 font-bold leading-relaxed italic">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 bg-slate-900 text-white rounded-[5rem] mx-6 mb-12 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/20 blur-[150px] rounded-full -mr-80 -mt-80 opacity-50"></div>
                <div className="container relative z-10">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-24 gap-12">
                        <div className="max-w-2xl text-left">
                            <h2 className="text-5xl lg:text-7xl font-black mb-8 tracking-tighter italic uppercase">{t.about.designTitle}</h2>
                            <p className="text-slate-400 text-xl font-bold leading-relaxed italic">
                                {t.about.designSubtitle}
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-6">
                            <div className="bg-white/5 px-8 py-5 rounded-[2rem] backdrop-blur-xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-default">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <ShieldCheck className="text-primary w-6 h-6" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[10px]">100% PRIVADO</span>
                            </div>
                            <div className="bg-white/5 px-8 py-5 rounded-[2rem] backdrop-blur-xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-default">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <Bell className="text-primary w-6 h-6" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[10px]">24/7 SOPORTE</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                title: t.about.designCards[0].title,
                                desc: t.about.designCards[0].desc,
                                icon: ShieldCheck
                            },
                            {
                                title: t.about.designCards[1].title,
                                desc: t.about.designCards[1].desc,
                                icon: Heart
                            },
                            {
                                title: t.about.designCards[2].title,
                                desc: t.about.designCards[2].desc,
                                icon: Smartphone
                            }
                        ].map((card, i) => (
                            <div key={i} className="group bg-white/5 p-12 rounded-[3.5rem] border border-white/10 hover:bg-white/10 transition-all duration-500 hover:translate-y-[-8px]">
                                <div className="bg-primary/10 p-5 rounded-[1.5rem] w-fit mb-10 group-hover:bg-primary/20 transition-colors">
                                    <card.icon className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 italic uppercase tracking-tight">{card.title}</h3>
                                <p className="text-slate-400 font-bold leading-relaxed italic">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 text-center">
                <div className="container">
                    <div className="max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-3 bg-emerald-50 text-emerald-600 px-8 py-3 rounded-full text-xs font-black mb-10 border border-emerald-100 uppercase tracking-widest shadow-lg shadow-emerald-50">
                            <Heart className="w-5 h-5" />
                            <span>{t.about.finalBtn}</span>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter italic uppercase">{t.about.finalTitle}</h2>
                        <p className="text-2xl text-slate-400 font-bold mb-16 italic">
                            {t.about.finalSubtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
                            <Link href="/register" className="bg-primary text-white py-6 px-12 rounded-[2rem] text-xl font-black uppercase tracking-widest shadow-[0_20px_50px_-10px_rgba(23,163,74,0.4)] hover:scale-105 active:scale-95 transition-all border-b-8 border-green-700">
                                {t.about.finalBtn}
                            </Link>
                            <Link href="/login" className="text-lg font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em] italic">
                                {t.about.haveAccount}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
