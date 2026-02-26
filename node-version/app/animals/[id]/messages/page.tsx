import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Calendar, Phone, MapPin, User } from "lucide-react";

export default async function FinderMessagesPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
        include: {
            qrCode: {
                include: {
                    finderMessages: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    });

    if (!animal || animal.ownerId !== session?.user?.id) {
        notFound();
    }

    const messages = animal.qrCode?.finderMessages || [];

    return (
        <div className="container max-w-4xl">
            <Link href={`/animals/${animal.id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a {animal.name}</span>
            </Link>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Mensajes de Buscadores</h1>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                    {messages.length} Mensajes
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p>No has recibido mensajes de personas que hayan encontrado a tu mascota.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="card p-6 border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full">
                                        <User className="w-5 h-5 text-blue-600" />
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
                                    <a href={`tel:${msg.senderPhone}`} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                        <Phone className="w-3 h-3" /> {msg.senderPhone}
                                    </a>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm italic mb-4">
                                "{msg.message}"
                            </div>

                            {msg.latitude && msg.longitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-green-100"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Ver ubicación en el Mapa
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
