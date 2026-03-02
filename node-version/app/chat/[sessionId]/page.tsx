import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ChatInterface from "@/components/ChatInterface";
import { MessageSquare, PawPrint, MapPin, User, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            qrCode: {
                include: {
                    animal: {
                        include: {
                            owner: true
                        }
                    }
                }
            },
            messages: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });

    if (!chatSession || !chatSession.qrCode?.animal) {
        notFound();
    }

    const { animal } = chatSession.qrCode;
    const isOwner = session?.user?.id === animal.ownerId;
    const participantName = isOwner ? chatSession.finderName || "Buscador" : "Dueño de " + animal.name;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="container max-w-2xl flex items-center gap-4">
                    {isOwner ? (
                        <Link href="/messages" className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                    ) : (
                        <Link href={`/s/${chatSession.qrCode.token}`} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="font-black text-gray-900 tracking-tight">Chat con {participantName}</h1>
                            {chatSession.isActive ? (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            ) : (
                                <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">Cerrado</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                            <PawPrint className="w-3 h-3" />
                            Sobre {animal.name}
                        </p>
                    </div>

                    {!isOwner && chatSession.qrCode.animal.isLost && (
                        <div className="hidden sm:block">
                            <span className="text-[10px] font-black bg-secondary/10 text-secondary px-3 py-1 rounded-full uppercase tracking-widest">
                                Extraviada
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden container max-w-2xl px-0 sm:px-4 flex flex-col">
                <ChatInterface
                    sessionId={sessionId}
                    initialMessages={chatSession.messages}
                    currentUserType={isOwner ? "OWNER" : "FINDER"}
                    participantName={participantName}
                />
            </div>
        </div>
    );
}
