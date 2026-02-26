import { prisma } from "@/lib/prisma";
import { Hospital, MapPin, Phone, Star, ShieldCheck, Search, Clock } from "lucide-react";
import Link from "next/link";

export default async function VetClinicsPage() {
    // In a real app, we would fetch users with role VET or Organizations of type CLINIC
    const clinics = await prisma.organization.findMany({
        where: { isActive: true },
        take: 6
    });

    // Fallback data for demo purposes if DB is empty
    const demoClinics = [
        {
            id: '1',
            name: 'Clínica Veterinaria San Francisco',
            address: 'Av. Insurgentes Sur 1234, CDMX',
            phone: '55 1234 5678',
            rating: 4.8,
            verified: true,
            hours: '24 Horas'
        },
        {
            id: '2',
            name: 'Hospital de Mascotas del Valle',
            address: 'Colonia Del Valle, C.P. 03100',
            phone: '55 8765 4321',
            rating: 4.5,
            verified: true,
            hours: '09:00 - 20:00'
        },
        {
            id: '3',
            name: 'Pet Care Center Satélite',
            address: 'Circuito Econuidores 45, Naucalpan',
            phone: '55 2244 6688',
            rating: 4.9,
            verified: true,
            hours: '08:00 - 22:00'
        }
    ];

    return (
        <div className="container pb-12">
            <header className="mb-12 pt-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                            <Hospital className="w-10 h-10 text-primary" />
                            Red Veterinaria
                        </h1>
                        <p className="text-gray-500 font-medium">Encuentra las mejores clínicas y profesionales cerca de ti.</p>
                    </div>
                </div>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Ciudad, CP o nombre de la clínica..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button className="btn-primary w-full md:w-auto px-8 py-3">Buscar Clínicas</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {demoClinics.map((clinic) => (
                    <div key={clinic.id} className="card p-0 overflow-hidden hover:shadow-xl transition-all group">
                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                            <img
                                src={`https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800`}
                                alt={clinic.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {clinic.verified && (
                                <div className="absolute top-4 right-4 bg-white text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-20 shadow-lg flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Verificado
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 z-20">
                                <div className="flex items-center gap-1 text-amber-400 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(clinic.rating) ? 'fill-current' : ''}`} />
                                    ))}
                                    <span className="text-white text-xs font-bold ml-1">{clinic.rating}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{clinic.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-primary shrink-0" />
                                {clinic.address}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    {clinic.hours}
                                </div>
                                <a href={`tel:${clinic.phone}`} className="bg-primary/5 text-primary p-2 rounded-full hover:bg-primary hover:text-white transition-all">
                                    <Phone className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 bg-gradient-to-br from-gray-900 to-black text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex-1 text-center lg:text-left">
                        <h2 className="text-3xl font-black mb-4">¿Eres Veterinario?</h2>
                        <p className="text-gray-400 font-medium mb-8 max-w-lg">
                            Únete a la red más grande de cuidado animal. Gestiona pacientes, historiales médicos y citas con nuestra plataforma especializada.
                        </p>
                        <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                            Registrar mi Clínica
                        </button>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                            <Hospital className="w-32 h-32 text-white/20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
