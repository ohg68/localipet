import { getVetsList } from "@/app/actions/admin";
import { Hospital, MapPin, Phone, Mail, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";

export default async function AdminVetsPage() {
    const vets = await getVetsList();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="card overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-black flex items-center gap-3 text-gray-900">
                        <Hospital className="w-6 h-6 text-primary" />
                        Organizaciones y Clínicas ({vets.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Organización</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Tipo</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Ubicación</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Contacto</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Estado</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vets.map((vet) => (
                                <tr key={vet.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 text-lg italic uppercase tracking-tight">{vet.name}</span>
                                            <span className="text-xs text-gray-400 font-bold font-mono">ID: {vet.id.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${vet.type === "vet"
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "bg-gray-100 text-gray-600 border border-gray-200"
                                            }`}>
                                            {vet.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800 flex items-center gap-1 leading-relaxed">
                                                <MapPin className="w-3 h-3 text-primary" />
                                                {vet.city}, {vet.country}
                                            </span>
                                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{vet.address}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 transition-colors hover:text-primary">
                                                <Phone className="w-3 h-3 text-primary" />
                                                {vet.phone || "Sin Teléfono"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-900">
                                                <Mail className="w-3 h-3" />
                                                {vet.email || "Sin Email"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            {vet.isVerified ? (
                                                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 w-fit">
                                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Verificada</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 w-fit">
                                                    <ShieldCheck className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendiente</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-gray-400 italic font-mono">{new Date(vet.createdAt).toLocaleDateString()}</span>
                                            {vet.website && (
                                                <a href={vet.website} target="_blank" className="mt-2 text-primary hover:scale-110 active:scale-95 transition-transform p-2 bg-primary/5 rounded-lg border border-primary/10">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-gray-100 p-8 rounded-full">
                                                <Hospital className="w-12 h-12 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-gray-900 mb-1">No hay organizaciones registradas</p>
                                                <p className="text-gray-400 font-medium italic">Aún no se han unido clínicas veterinarias a la red.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
