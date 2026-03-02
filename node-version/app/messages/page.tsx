import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Calendar, Phone, MapPin, User, ArrowRight, PawPrint } from "lucide-react";

export default async function GlobalMessagesPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const messages = await prisma.finderMessage.findMany({
        where: {
            qrCode: {
                animal: {
                    ownerId: session.user.id
                }
            }
        },
        include: {
            qrCode: {
                include: {
                    animal: true,
                    chatSessions: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="container max-w-4xl pb-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-secondary/5 p-4 rounded-2xl">
                    <MessageSquare className="w-8 h-8 text-secondary" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bandeja de Entrada</h1>
                    <p className="text-gray-500 font-medium">Todos los avisos de personas que han encontrado a tus mascotas.</p>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="card p-20 text-center flex flex-col items-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No hay mensajes aún</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Cuando alguien escanee el QR de una mascota extraviada y te envíe un aviso, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className="card overflow-hidden border-l-4 border-l-secondary shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <PawPrint className="w-4 h-4" />
                                    Mascota: <span className="text-gray-900">{msg.qrCode.animal?.name || 'Mascota Desconocida'}</span>
                                </div>
                                <div className="text-[10px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {msg.isRead ? 'Leído' : 'Nuevo'}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full">
                                            <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{msg.senderName}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    {msg.senderPhone && (
                                        <a href={`tel:${msg.senderPhone}`} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg">
                                            <Phone className="w-3 h-3" /> {msg.senderPhone}
                                        </a>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-100 p-4 rounded-xl text-gray-700 text-sm italic mb-6 shadow-sm">
                                    "{msg.message}"
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {msg.latitude && msg.longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-colors border border-green-100"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Ver Ubicación
                                        </a>
                                    )}
                                    <Link
                                        href={`/chat/${msg.qrCode.chatSessions[0]?.id}`}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl transition-colors shadow-sm"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Conversar
                                    </Link>
                                    <Link
                                        href={`/animals/${msg.qrCode.animal?.id || ''}`}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors border border-gray-200 ml-auto"
                                    >
                                        Ir a Mascota
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
