import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PawPrint, MapPin, Calendar, Search, AlertCircle, MessageSquare, Hash } from "lucide-react";
import ShortCodeSearch from "@/components/ShortCodeSearch";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function LostPetsPage() {
    const locale = await getLocale();
    const t = translations[locale];

    const lostAnimals = await prisma.animal.findMany({
        where: {
            isLost: true,
            isActive: true,
        },
        include: {
            qrCode: true,
            owner: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: {
            lostSince: 'desc'
        }
    });

    return (
        <div className="container pb-12">
            <header className="mb-12 text-center pt-8">
                <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-rose-100 shadow-sm">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    <span>{t.lostPets.badge}</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tighter italic uppercase underline decoration-primary decoration-8 underline-offset-8 decoration-skip-ink">
                    {t.lostPets.title}
                </h1>
                <p className="text-xl text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed italic">
                    {t.lostPets.description}
                </p>
            </header>

            <div className="max-w-3xl mx-auto mb-16">
                <div className="bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl">
                    <ShortCodeSearch locale={locale} />
                </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 mb-12 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                    <input
                        type="text"
                        placeholder={t.lostPets.searchPlaceholder}
                        className="w-full pl-16 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800"
                    />
                </div>
                <button className="bg-slate-900 text-white w-full md:w-auto px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-primary transition-all active:scale-95 shadow-lg border-b-8 border-slate-800">
                    {t.lostPets.filter}
                </button>
            </div>

            {lostAnimals.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-24 rounded-[4rem] text-center flex flex-col items-center">
                    <div className="bg-emerald-50 p-10 rounded-[2rem] mb-8 shadow-inner">
                        <PawPrint className="w-20 h-20 text-emerald-500 mx-auto" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 italic uppercase tracking-tight">{t.lostPets.noLostTitle}</h3>
                    <p className="text-slate-400 font-bold text-lg italic max-w-md mx-auto">{t.lostPets.noLost}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {lostAnimals.map((animal) => (
                        <div key={animal.id} className="bg-white rounded-[3rem] overflow-hidden group border-2 border-rose-50 hover:border-rose-500 transition-all duration-500 shadow-xl hover:shadow-2xl hover:translate-y-[-8px]">
                            <div className="h-64 bg-slate-100 relative overflow-hidden">
                                {animal.photo ? (
                                    <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <PawPrint className="w-24 h-24 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-6 left-6 bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] animate-pulse shadow-2xl border border-rose-400">
                                    {t.lostPets.lookingFor}
                                </div>
                                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg border border-white">
                                    <Calendar className="w-4 h-4 text-rose-500" />
                                    <span className="uppercase tracking-widest">{t.lostPets.since} {animal.lostSince ? new Date(animal.lostSince).toLocaleDateString() : t.lostPets.none}</span>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors italic uppercase leading-none tracking-tighter">{animal.name}</h3>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                                        {locale === 'es' ? animal.species : (animal.species === 'DOG' ? t.scan.dog : t.scan.cat)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-bold mb-6 flex items-center gap-3 italic">
                                    <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    {t.lostPets.lastSeen} <span className="text-slate-900 not-italic">{animal.owner.profile?.city || t.lostPets.none}</span>
                                </p>

                                <div className="space-y-6 pt-6 border-t border-slate-50">
                                    <p className="text-sm text-slate-400 font-bold line-clamp-2 italic leading-relaxed">
                                        "{animal.description || t.lostPets.noDescription}"
                                    </p>

                                    <div className="flex gap-4 pt-2">
                                        <Link
                                            href={`/s/${animal.qrCode?.token}`}
                                            className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs text-center hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border-b-4 border-slate-950"
                                        >
                                            <Search className="w-4 h-4" />
                                            {t.lostPets.viewProfile}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
