import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, Phone, MapPin, Heart, Globe } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import FinderMessageForm from "@/components/FinderMessageForm";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function PublicScanPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const locale = await getLocale();
    const t = translations[locale];

    const qrCode = await prisma.qRCode.findUnique({
        where: { token, isActive: true },
        include: {
            animal: {
                include: {
                    owner: {
                        include: {
                            profile: true,
                        }
                    }
                }
            }
        }
    });

    if (!qrCode) {
        notFound();
    }

    if (!qrCode.animalId) {
        redirect(`/register-tag/${token}`);
    }

    const animal = qrCode.animal;
    if (!animal) {
        notFound();
    }
    const { owner } = animal;

    // Log scan (Server-side)
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";

    await prisma.scanLog.create({
        data: {
            qrCodeId: qrCode.id,
            ipAddress,
            userAgent,
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            {/* Header / Brand */}
            <div className="w-full bg-white border-b border-slate-100 py-6 mb-4">
                <div className="container max-w-lg flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-1 group transition-all">
                        <span className="text-xl font-black tracking-tight text-primary">Locali</span>
                        <div className="bg-secondary w-6 h-7 rounded-t-full rounded-bl-full flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                            <div className="bg-white w-1.5 h-1.5 rounded-full mb-1"></div>
                        </div>
                        <span className="text-xl font-black tracking-tight text-primary ml-0.5">et</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                        <Globe className="w-3 h-3" />
                        <span>{locale.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="container max-w-lg pb-12">
                {animal.isLost && (
                    <div className="bg-secondary text-white p-6 rounded-[2rem] mb-8 flex items-center gap-5 shadow-2xl shadow-secondary/20 animate-pulse border-4 border-secondary/50">
                        <AlertTriangle className="w-12 h-12 flex-shrink-0" />
                        <div>
                            <h2 className="font-extrabold text-2xl uppercase italic leading-none mb-1">{t.scan.lost}</h2>
                            <p className="text-sm font-bold opacity-90 leading-tight">{t.scan.lostDesc}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-white">
                    <div className="h-80 bg-slate-200 relative group overflow-hidden">
                        {animal.photo ? (
                            <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 italic font-black text-slate-300">
                                <Heart className="w-24 h-24 mb-4 opacity-20" />
                                <span className="text-2xl uppercase tracking-widest">{animal.name}</span>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-10">
                            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">
                                {animal.name}
                            </h1>
                        </div>
                    </div>

                    <div className="p-10">
                        <div className="flex gap-6 mb-12">
                            <div className="flex-1 bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">{t.scan.species}</p>
                                <p className="font-black text-xl italic text-slate-800 capitalize leading-none">{locale === 'es' ? animal.species : (animal.species === 'DOG' ? 'CÃO' : (animal.species === 'CAT' ? 'GATO' : animal.species))}</p>
                            </div>
                            <div className="flex-1 bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">{t.scan.breed}</p>
                                <p className="font-black text-xl italic text-slate-800 truncate leading-none">{animal.breed || t.scan.mestizo}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-8 bg-primary rounded-full"></div>
                                <h3 className="font-black text-slate-900 uppercase italic tracking-widest text-sm">{t.scan.ownerContact}</h3>
                            </div>

                            <a href={`tel:${owner.profile?.phone}`} className="flex items-center gap-6 bg-primary text-white p-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 hover:bg-primary-hover transition-all active:scale-95 border-b-8 border-primary-hover/50">
                                <div className="bg-white text-primary p-4 rounded-2xl shadow-inner">
                                    <Phone className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-1">{t.scan.callNow}</p>
                                    <p className="text-3xl font-black tabular-nums tracking-tighter leading-none">{owner.profile?.phone || "---"}</p>
                                </div>
                            </a>

                            <div className="grid grid-cols-1 gap-2 pt-4">
                                <FinderMessageForm qrCodeId={qrCode.id} />
                            </div>
                        </div>

                        {animal.medicalNotes && (
                            <div className="mt-12 bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform"></div>
                                <h4 className="text-amber-800 font-black mb-4 flex items-center gap-4 uppercase italic tracking-widest text-sm relative z-10">
                                    <AlertTriangle className="w-6 h-6" />
                                    {t.scan.medicalInfo}
                                </h4>
                                <p className="text-amber-900 font-bold text-lg leading-relaxed relative z-10 italic">
                                    "{animal.medicalNotes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center pb-8 border-t border-slate-200 pt-10">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="bg-secondary/10 p-1.5 rounded-lg group-hover:bg-secondary transition-colors">
                            <Heart className="w-4 h-4 text-secondary group-hover:text-white" />
                        </div>
                        <span className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em] italic">{t.scan.poweredBy}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
