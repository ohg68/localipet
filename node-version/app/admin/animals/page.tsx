import { getAnimalsList } from "@/app/actions/admin";
import { PawPrint, User, QrCode, Calendar, Info, ShieldCheck } from "lucide-react";
import AdminAnimalActions from "@/components/AdminAnimalActions";

export default async function AdminAnimalsPage() {
    const animals = await getAnimalsList();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="card overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <PawPrint className="w-6 h-6 text-primary" />
                        Listado de Mascotas ({animals.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Mascota</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Dueño Responsable</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Especie/Raza</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Vínculo QR</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Estado</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Fecha</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Acciones Manuales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {animals.map((animal) => (
                                <tr key={animal.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            {animal.photo ? (
                                                <img
                                                    src={animal.photo}
                                                    alt={animal.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <PawPrint className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 text-lg italic">{animal.name}</span>
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{animal.breed || animal.species}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 flex items-center gap-1">
                                                <User className="w-3 h-3 text-gray-400" />
                                                {animal.owner.firstName} {animal.owner.lastName}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">{animal.owner.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{animal.species}</span>
                                            <span className="text-xs text-gray-400 font-medium text-wrap max-w-24">{animal.breed || animal.color || "-"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {animal.qrCode ? (
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                    <QrCode className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-xs font-mono">#{animal.qrCode.shortCode}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-red-300 italic">Sin vincular</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest w-fit ${animal.isLost
                                                ? "bg-rose-100 text-rose-600 border border-rose-200"
                                                : "bg-green-100 text-green-600 border border-green-200"
                                                }`}>
                                                {animal.isLost ? "Perdido" : "Protegido"}
                                            </span>
                                            {!animal.isActive && (
                                                <span className="text-[10px] text-gray-400 font-black uppercase text-center w-full">Bloqueada</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            {new Date(animal.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end">
                                            <AdminAnimalActions
                                                animalId={animal.id}
                                                isLost={animal.isLost}
                                                isActive={animal.isActive}
                                                hasTag={!!animal.qrCode}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
