"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon, RefreshCw, Smartphone } from "lucide-react";
import clsx from "clsx";

export default function VetChatClient({ orgId, locale }: { orgId: string, locale: string }) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        if (!message.trim() || !activeSession) return;

        const currentMsg = message;
        setMessage("");
        setIsSending(true);

        try {
            const res = await fetch("/api/vet/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: activeSession.id,
                    content: currentMsg
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
                        <form onSubmit={handleSendMessage} className="flex gap-2 relative items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe un mensaje al dueño de la mascota..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-16 text-gray-800 font-medium"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || isSending}
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
