import Link from "next/link";
import { ArrowRight, ShieldCheck, QrCode, MessageSquare, Heart, MapPin, Smartphone, Zap } from "lucide-react";
import { auth } from "@/auth";
import ShortCodeSearch from "@/components/ShortCodeSearch";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Home() {
  const session = await auth();
  const locale = await getLocale();
  const t = translations[locale];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-24 pb-24 lg:pt-32 lg:pb-40">
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 text-center lg:text-left">
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-black mb-8 animate-in slide-in-from-top-4 duration-500 uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                <span>{t.hero.badge}</span>
              </div>
              <h1 className="text-5xl lg:text-[5.5rem] font-black text-gray-900 tracking-tighter leading-[0.9] mb-8 animate-in slide-in-from-left-4 duration-700">
                {t.hero.title} <br />
                <span className="text-primary italic">{t.hero.titleAccent}</span>
              </h1>
              <p className="text-xl text-gray-500 mb-12 max-w-xl leading-relaxed mx-auto lg:mx-0 animate-in slide-in-from-left-8 duration-700 font-medium italic">
                {t.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start animate-in slide-in-from-bottom-4 duration-700">
                {session ? (
                  <Link href="/dashboard" className="btn-primary py-5 px-10 text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto">
                    {t.hero.ctaDashboard}
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn-primary py-5 px-10 text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto">
                      {t.hero.ctaRegister}
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                    <Link href="/login" className="text-xl font-black text-gray-400 hover:text-primary transition-colors text-center w-full sm:w-auto uppercase tracking-widest">
                      {t.hero.ctaLogin}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 relative animate-in zoom-in duration-1000 w-full max-w-2xl">
              <div className="absolute -inset-10 bg-primary/10 rounded-[4rem] blur-[100px] -z-10 rotate-12"></div>
              <div className="card p-3 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rotate-3 hover:rotate-0 transition-all duration-700 hover:scale-[1.02]">
                <img
                  src="/hero_pet.png"
                  alt="Pet with QR tag"
                  className="rounded-[2.5rem] w-full shadow-inner aspect-[4/5] object-cover"
                />
              </div>
              {/* Floating Element 1 */}
              <div className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-bounce duration-[4000ms] border border-white">
                <div className="bg-green-500 p-3 rounded-2xl text-white shadow-lg shadow-green-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                  <p className="text-xl font-black text-gray-900 italic">PROTEGIDO</p>
                </div>
              </div>
              {/* Floating Element 2 */}
              <div className="absolute -top-10 -right-10 bg-white/90 backdrop-blur p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-pulse border border-white">
                <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-500/20">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Alert</p>
                  <p className="text-xl font-black text-gray-900 italic">{locale === 'es' ? 'ESCANEADO' : 'LIDO'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative z-20 -mt-16 mb-20 px-4">
        <div className="container max-w-4xl">
          <div className="bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl shadow-slate-900/40">
            <ShortCodeSearch />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-32 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">{t.features.title}</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto mb-8 rounded-full"></div>
            <p className="text-2xl text-slate-500 font-bold max-w-3xl mx-auto italic leading-relaxed">{t.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { icon: QrCode, color: "text-primary", bg: "bg-primary/10" },
              { icon: MessageSquare, color: "text-secondary", bg: "bg-secondary/10" },
              { icon: Heart, color: "text-primary", bg: "bg-primary/10" },
              { icon: Smartphone, color: "text-secondary", bg: "bg-secondary/10" }
            ].map((style, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all group hover:-translate-y-2 border border-slate-100 flex flex-col items-center text-center">
                <div className={`${style.bg} ${style.color} w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm`}>
                  <style.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 italic leading-tight">{t.features.items[i].title}</h3>
                <p className="text-slate-400 font-bold leading-relaxed">{t.features.items[i].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <QrCode className="w-[800px] h-[800px] absolute -right-40 -top-40 rotate-12" />
        </div>
        <div className="container relative z-10 text-center text-white">
          <h2 className="text-5xl lg:text-[5rem] font-black mb-8 tracking-tighter leading-none">{t.cta.title}</h2>
          <p className="text-2xl text-white/80 mb-16 max-w-3xl mx-auto font-bold italic leading-relaxed">
            {t.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <Link href="/register" className="bg-white text-primary px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest leading-none">
              {t.cta.register}
            </Link>
            <Link href="/about" className="px-10 py-6 font-black text-white hover:text-white/80 transition-colors border-2 border-white/20 rounded-2xl text-xl uppercase tracking-widest leading-none">
              {t.cta.howItWorks}
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-12">
          <Link href="/" className="flex items-center gap-0 group transition-all">
            <span className="text-3xl font-black tracking-tight text-primary uppercase">Locali</span>
            <span className="text-3xl font-black tracking-tight text-secondary uppercase">p</span>
            <span className="text-3xl font-black tracking-tight text-primary uppercase">et</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-12 text-sm font-black text-slate-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-primary transition-colors">{t.footer.privacy}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{t.footer.terms}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{t.footer.contact}</Link>
          </div>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
