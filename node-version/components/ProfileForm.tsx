"use client";

import { useState } from "react";
import { User, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

interface ProfileFormProps {
    user: any;
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setSuccess(false);
        setError(null);
        try {
            await updateProfile(formData);
            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Error al actualizar perfil");
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-100 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    ¡Perfil actualizado correctamente!
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 font-medium text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="firstName"
                            type="text"
                            defaultValue={user.firstName}
                            required
                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="lastName"
                            type="text"
                            defaultValue={user.lastName}
                            required
                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="phone"
                            type="tel"
                            defaultValue={user.profile?.phone || ""}
                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="city"
                            type="text"
                            defaultValue={user.profile?.city || ""}
                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="address"
                            type="text"
                            defaultValue={user.profile?.address || ""}
                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary justify-center py-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                </button>
            </div>
        </form>
    );
}
