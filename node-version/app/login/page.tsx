"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { HeartPulse, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { authenticate } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";

function LoginForm() {
    const { t } = useTranslations();
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    return (
        <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-8 font-black uppercase tracking-widest text-xs transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver
            </Link>

            <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-white">
                <div className="text-center mb-10">
                    <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <HeartPulse className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{t.auth.titleLogin}</h1>
                    <p className="text-slate-400 font-bold italic">{t.auth.subtitleLogin}</p>
                </div>

                {registered && (
                    <div className="mb-8 bg-primary/5 text-primary p-6 rounded-[2rem] border-2 border-primary/10 flex items-center gap-4 shadow-lg shadow-primary/5">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-sm font-black italic">¡Cuenta creada con éxito! Por favor, inicia sesión.</p>
                    </div>
                )}

                <form action={dispatch} className="space-y-6">
                    {errorMessage && (
                        <div className="bg-secondary/5 text-secondary p-4 rounded-2xl text-sm font-bold border border-secondary/10 italic">
                            {errorMessage}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">{t.auth.labelEmail}</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-6 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">{t.auth.labelPass}</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-6 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border-b-8 border-primary-hover/50 mt-4"
                    >
                        {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : t.auth.btnLogin}
                    </button>
                </form>

                <div className="mt-10 text-center border-t border-slate-50 pt-8">
                    <p className="text-slate-400 font-bold mb-4 italic">{t.auth.noAccount}</p>
                    <Link href="/register" className="text-primary font-black uppercase tracking-widest text-xs hover:text-primary-hover transition-colors">
                        {t.auth.btnRegister}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Suspense fallback={<div className="font-black italic text-slate-300 animate-pulse text-2xl uppercase tracking-widest">Cargando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
