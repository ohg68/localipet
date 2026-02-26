import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { QrCode, LogIn, UserPlus, PawPrint, CreditCard } from "lucide-react";

export default async function RegisterTagPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const session = await auth();

    const qrCode = await prisma.qRCode.findUnique({
        where: { token, isActive: true },
        include: { animal: true }
    });

    if (!qrCode) {
        notFound();
    }

    if (qrCode.animalId) {
        redirect(`/s/${token}`);
    }

    return (
        <div className="container max-w-2xl pt-12 pb-24">
            <header className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-3xl mb-6 shadow-sm border border-primary/20">
                    <QrCode className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight lg:text-5xl mb-4">¡Tag Encontrado!</h1>
                <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed">
                    Este dispositivo Localipet aún no ha sido vinculado a ninguna mascota.
                </p>
            </header>

            {!session ? (
                <div className="space-y-6">
                    <div className="card p-8 bg-gray-900 text-white border-0 shadow-2xl">
                        <h2 className="text-2xl font-black mb-4">¿Ya tienes una cuenta?</h2>
                        <p className="text-gray-400 mb-8 font-medium">Inicia sesión para vincular este tag a una mascota existente o registrar una nueva protegiéndola de inmediato.</p>
                        <Link
                            href={`/login?callbackUrl=/register-tag/${token}`}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg shadow-lg"
                        >
                            <LogIn className="w-5 h-5" /> Iniciar Sesión
                        </Link>
                    </div>

                    <div className="card p-8 border-2 border-gray-100 shadow-xl">
                        <h2 className="text-2xl font-black mb-4 text-gray-900">¿Eres nuevo en Localipet?</h2>
                        <p className="text-gray-500 mb-8 font-medium">Crea una cuenta gratuita en pocos segundos y comienza a proteger a tu mejor amigo.</p>
                        <Link
                            href={`/register?callbackUrl=/register-tag/${token}`}
                            className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-lg hover:bg-gray-200 transition-all border border-gray-200"
                        >
                            <UserPlus className="w-5 h-5" /> Crear Cuenta Nueva
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="card p-8 border-primary border-2 shadow-2xl shadow-primary/10 bg-gradient-to-br from-white to-primary/5">
                        <h2 className="text-2xl font-black mb-2 text-gray-900">Bienvenido, {session.user.name}</h2>
                        <p className="text-gray-500 mb-8 font-medium">¿Qué te gustaría hacer con este nuevo Tag?</p>

                        <div className="space-y-4">
                            <Link
                                href={`/animals/create?qrToken=${token}`}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
                            >
                                <PlusIcon className="w-6 h-6" /> Registrar Nueva Mascota
                            </Link>

                            <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 py-2">O vincular a una existente</p>

                            <Link
                                href={`/animals?pickForToken=${token}`}
                                className="w-full bg-white text-gray-900 border-2 border-gray-100 py-4 rounded-2xl font-black flex items-center justify-center gap-3 text-lg hover:border-primary/30 transition-all shadow-sm"
                            >
                                <PawPrint className="w-6 h-6 text-primary" /> Seleccionar Mascota
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-center text-gray-400 font-bold text-xs uppercase tracking-widest pt-4">
                        <CreditCard className="w-4 h-4" />
                        <span>Suscripción Digital Incluida</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    )
}
