"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon, RefreshCw, Smartphone, Image as ImageIcon, X } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

export default function VetChatClient({ orgId, locale }: { orgId: string, locale: string }) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/vet/chat?orgId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions);
                if (!activeSession && data.sessions.length > 0) {
                    setActiveSession(data.sessions[0]);
                } else if (activeSession) {
                    // Update active session with new messages
                    const updated = data.sessions.find((s: any) => s.id === activeSession.id);
                    if (updated) setActiveSession(updated);
                }
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Polling every 5 seconds
    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000);
        return () => clearInterval(interval);
    }, [orgId]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!message.trim() && !selectedImage) || !activeSession) return;

        const currentMsg = message;
        const currentImg = selectedImage;

        setMessage("");
        setSelectedImage(null);
        setIsSending(true);

        try {
            const res = await fetch("/api/vet/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: activeSession.id,
                    content: currentMsg,
                    imageUrl: currentImg
                })
            });

            if (res.ok) {
                await fetchSessions();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[600px] items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col h-[600px] items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm text-center p-8">
                <Smartphone className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-2xl font-black text-gray-800 italic">Sin conversaciones activas</h3>
                <p className="text-gray-500 font-medium mt-2 max-w-sm">Cuando los dueños de mascotas se comuniquen contigo desde la App Móvil de Localipet, aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="flex h-[750px] bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-primary/5 overflow-hidden">
            {/* Sidebar (Lista de sesiones) */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h3 className="font-black text-xl italic text-gray-900">Mensajes</h3>
                    <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mt-1">App Móvil</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {sessions.map((session) => {
                        const lastMsg = session.messages[session.messages.length - 1];
                        const isActive = activeSession?.id === session.id;
                        return (
                            <button
                                key={session.id}
                                onClick={() => setActiveSession(session)}
                                className={clsx(
                                    "w-full text-left p-4 rounded-2xl transition-all border",
                                    isActive ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white border-transparent hover:border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isActive ? "bg-primary/20" : "bg-gray-100")}>
                                        <UserIcon className={clsx("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-gray-900 truncate">
                                                {session.user.firstName} {session.user.lastName}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate font-medium">
                                            {lastMsg ? lastMsg.content : "Nueva conversación"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ventana de Chat Activa */}
            {activeSession ? (
                <div className="flex-1 flex flex-col bg-[#FAFAFA]">
                    {/* Header Activo */}
                    <div className="p-6 bg-white border-b border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-black text-xl text-gray-900">
                                {activeSession.user.firstName} {activeSession.user.lastName}
                            </h4>
                            <p className="text-xs text-gray-400 font-bold tracking-wider">{activeSession.user.email}</p>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeSession.messages.length === 0 ? (
                            <div className="text-center text-gray-400 font-medium italic mt-10">Aún no hay mensajes. Rompe el hielo.</div>
                        ) : (
                            activeSession.messages.map((msg: any) => {
                                const isClinic = msg.senderType === 'CLINIC';
                                return (
                                    <div key={msg.id} className={clsx("flex flex-col max-w-[70%]", isClinic ? "self-end items-end" : "self-start items-start")}>
                                        <div className={clsx(
                                            "p-4 rounded-3xl shadow-sm text-sm font-medium",
                                            isClinic ? "bg-primary text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                        )}>
                                            {msg.imageUrl && (
                                                <div className="mb-2 max-w-sm rounded-xl overflow-hidden shadow-sm">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Sent image"
                                                        className="w-full h-auto object-cover max-h-64"
                                                    />
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 font-bold italic px-2">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input y Send */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {selectedImage && (
                            <div className="mb-3 p-2 bg-gray-50 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-xs font-bold text-gray-500 italic">Imagen lista para enviar...</p>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2 relative items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                            >
                                <ImageIcon className="w-6 h-6" />
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-16 text-gray-800 font-medium"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={(!message.trim() && !selectedImage) || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-opacity hover:bg-brand-600"
                            >
                                <Send className="w-5 h-5 ml-1" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
