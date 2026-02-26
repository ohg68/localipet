import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PawPrint, MapPin, Calendar, Search, AlertCircle, MessageSquare, Hash } from "lucide-react";
import ShortCodeSearch from "@/components/ShortCodeSearch";

export default async function LostPetsPage() {
    const lostAnimals = await prisma.animal.findMany({
        where: {
            isLost: true,
            isActive: true,
        },
        include: {
            qrCode: true,
            owner: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: {
            lostSince: 'desc'
        }
    });

    return (
        <div className="container pb-12">
            <header className="mb-12 text-center pt-8">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Emergencia Comunitaria</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight">Mascotas Extraviadas</h1>
                <p className="text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Ayúdanos a que estos compañeros vuelvan a casa. Si has visto a alguno de ellos, por favor contacta a sus dueños o escanea su código QR si es posible.
                </p>
            </header>

            <div className="max-w-2xl mx-auto mb-12">
                <ShortCodeSearch />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, especie o ciudad..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button className="btn-primary w-full md:w-auto px-8 py-3">Filtrar</button>
            </div>

            {lostAnimals.length === 0 ? (
                <div className="card p-20 text-center flex flex-col items-center">
                    <div className="bg-green-50 p-6 rounded-full mb-6">
                        <PawPrint className="w-16 h-16 text-green-500 mx-auto" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Buenas noticias!</h3>
                    <p className="text-gray-500 max-w-md mx-auto">No hay reportes de mascotas extraviadas en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {lostAnimals.map((animal) => (
                        <div key={animal.id} className="card overflow-hidden group border-2 border-red-100 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-4px]">
                            <div className="h-56 bg-gray-100 relative overflow-hidden">
                                {animal.photo ? (
                                    <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <PawPrint className="w-20 h-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-lg">
                                    Se busca
                                </div>
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                    <Calendar className="w-3 h-3 text-red-500" />
                                    Desde {animal.lostSince ? new Date(animal.lostSince).toLocaleDateString() : 'Desconocido'}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-2xl font-black text-gray-900">{animal.name}</h3>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{animal.species}</span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                    Última vez visto: <span className="text-gray-900">{animal.owner.profile?.city || 'Referencia no disponible'}</span>
                                </p>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 line-clamp-2 italic font-medium">
                                        "{animal.description || 'Sin descripción adicional'}"
                                    </p>

                                    <div className="flex gap-2 pt-2">
                                        <Link
                                            href={`/s/${animal.qrCode?.token}`}
                                            className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold text-center hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Search className="w-4 h-4" />
                                            Ver Ficha
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
