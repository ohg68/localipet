"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { HeartPulse, Loader2, CheckCircle } from "lucide-react";
import { authenticate } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";

function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    return (
        <div className="card w-full max-w-md p-8">
            <div className="text-center mb-8">
                <HeartPulse className="w-12 h-12 text-primary mx-auto mb-2" />
                <h1 className="text-2xl font-bold italic">Localipet</h1>
                <p className="text-gray-500">Inicia sesión en tu cuenta</p>
            </div>

            {registered && (
                <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-md border border-green-100 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">¡Cuenta creada con éxito! Por favor, inicia sesión.</p>
                </div>
            )}

            <form action={dispatch} className="space-y-4">
                {errorMessage && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                        {errorMessage}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="tu@email.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full btn-primary justify-center py-3 mt-2 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary font-bold hover:underline">
                    Regístrate aquí
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <Suspense fallback={<div>Cargando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
