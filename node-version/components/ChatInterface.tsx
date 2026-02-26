"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/app/actions/chat";
import { cn } from "@/lib/utils";

export default function ChatInterface({
    sessionId,
    initialMessages,
    currentUserType,
    participantName
}: {
    sessionId: string,
    initialMessages: any[],
    currentUserType: "FINDER" | "OWNER",
    participantName: string
}) {
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isSending) return;

        const content = inputValue.trim();
        setInputValue("");
        setIsSending(true);

        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticMsg = {
            id: tempId,
            senderType: currentUserType,
            content,
            createdAt: new Date(),
        };
        setMessages([...messages, optimisticMsg]);

        try {
            const result = await sendChatMessage(sessionId, currentUserType, content);
            if (!result.success) {
                // Remove optimistic message if failed
                setMessages(messages.filter(m => m.id !== tempId));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(messages.filter(m => m.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-2xl rounded-t-3xl overflow-hidden mt-4">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                <div className="text-center py-8">
                    <div className="bg-gray-50 inline-block p-4 rounded-full mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Chat Seguro Iniciado</p>
                    <p className="text-[10px] text-gray-300 mt-1">Los mensajes se guardan de forma segura para ayudar en la recuperación.</p>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.senderType === currentUserType;
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex animate-in slide-in-from-bottom-2 duration-300",
                                isMe ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className="max-w-[85%] group">
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl shadow-sm text-sm",
                                    isMe
                                        ? "bg-primary text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 mt-1 px-1",
                                    isMe ? "justify-end" : "justify-start"
                                )}>
                                    <span className="text-[9px] text-gray-400 font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 pb-8 sm:pb-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        className="bg-primary text-white p-3 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
