"use client";

import { useState } from "react";
import { MessageSquare, Loader2, Send, CheckCircle } from "lucide-react";
import { sendFinderMessage } from "@/app/actions/messages";

interface FinderMessageFormProps {
    qrCodeId: string;
}

export default function FinderMessageForm({ qrCodeId }: FinderMessageFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        if (location) {
            formData.append("latitude", location.lat.toString());
            formData.append("longitude", location.lng.toString());
        }

        try {
            const result = await sendFinderMessage(qrCodeId, formData);
            if (result.success && result.chatSessionId) {
                // Redirect to the chat page after a brief success message or immediately
                setSuccess(true);
                setLoading(false);
                // We'll use a public chat route
                setTimeout(() => {
                    window.location.href = `/chat/${result.chatSessionId}`;
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || "Error al enviar el mensaje");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-100 text-center animate-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">¡Mensaje Enviado!</h3>
                <p className="text-sm">Gracias por ayudar. El dueño recibirá tu mensaje de inmediato.</p>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary p-4 rounded-xl font-bold hover:bg-primary/5 transition-colors shadow-sm"
            >
                <MessageSquare className="w-5 h-5" />
                Enviar Mensaje al Dueño
            </button>
        );
    }

    return (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center bg-gray-50 border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900">Enviar Aviso</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider">Cancelar</button>
            </div>

            <form action={handleSubmit} className="space-y-4">
                {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tu Nombre</label>
                    <input
                        name="senderName"
                        type="text"
                        required
                        placeholder="Juan Pérez"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tu Teléfono (Opcional)</label>
                    <input
                        name="senderPhone"
                        type="tel"
                        placeholder="+52 55..."
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                    <textarea
                        name="message"
                        required
                        rows={3}
                        placeholder="He encontrado a tu mascota en la plaza principal. Está conmigo..."
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none"
                    ></textarea>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        id="share-location"
                        onChange={(e) => e.target.checked ? handleGetLocation() : setLocation(null)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="share-location" className="text-xs text-gray-600 cursor-pointer">Compartir mi ubicación actual</label>
                    {location && <span className="text-[10px] text-green-600 font-bold">✓ Ubicación fijada</span>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white p-4 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar Ahora</>}
                </button>
            </form>
        </div>
    );
}
