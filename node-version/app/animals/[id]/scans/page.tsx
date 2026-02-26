import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock, Globe } from "lucide-react";

export default async function ScanHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
        include: {
            qrCode: {
                include: {
                    scans: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    });

    if (!animal || animal.ownerId !== session?.user?.id) {
        notFound();
    }

    const scans = animal.qrCode?.scans || [];

    return (
        <div className="container max-w-4xl">
            <Link href={`/animals/${animal.id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a {animal.name}</span>
            </Link>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Historial de Escaneos</h1>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                    {scans.length} Escaneos totales
                </div>
            </div>

            {scans.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p>Aún no hay escaneos registrados para esta mascota.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {scans.map((scan) => (
                        <div key={scan.id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-100 p-3 rounded-full">
                                    <MapPin className="w-6 h-6 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Escaneo Detectado</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(scan.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(scan.createdAt).toLocaleTimeString()}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">{scan.ipAddress}</p>
                                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate">{scan.userAgent}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
