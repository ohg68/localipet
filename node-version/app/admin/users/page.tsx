import { getUsersList } from "@/app/actions/admin";
import { Users, Mail, Calendar, PawPrint, ShieldCheck } from "lucide-react";

export default async function AdminUsersPage() {
    const users = await getUsersList();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="card overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Listado de Usuarios ({users.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Usuario</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Rol</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Ubicación</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Mascotas</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 text-lg">
                                                {user.firstName} {user.lastName}
                                                {!user.firstName && !user.lastName && (user.username || "Sin Nombre")}
                                            </span>
                                            <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-gray-300" />
                                                {user.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${user.profile?.role === "ADMIN"
                                                ? "bg-rose-100 text-rose-600 border border-rose-200"
                                                : "bg-green-100 text-green-600 border border-green-200"
                                            }`}>
                                            {user.profile?.role || "OWNER"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm text-gray-500 font-medium">
                                            {user.profile?.city && user.profile?.country
                                                ? `${user.profile.city}, ${user.profile.country}`
                                                : user.profile?.country || "No especificado"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                                <PawPrint className="w-4 h-4" />
                                            </div>
                                            <span className="font-black text-gray-900">{(user as any)._count.animals}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            {new Date(user.createdAt).toLocaleDateString()}
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
