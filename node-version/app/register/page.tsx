"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartPulse, Loader2 } from "lucide-react";
import { register } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setError(null);
        setLoading(true);

        const result = await register(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else if (result?.success) {
            router.push("/login?registered=true");
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12">
            <div className="card w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <HeartPulse className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h1 className="text-2xl font-bold italic">Localipet</h1>
                    <p className="text-gray-500">Crea tu cuenta gratuita</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                name="firstName"
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <input
                                name="lastName"
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
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
                            placeholder="Min. 6 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary justify-center py-3 mt-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Cuenta"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
