import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { User as UserIcon } from "lucide-react";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="container max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary/10 p-4 rounded-2xl">
                    <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Mi Perfil</h1>
                    <p className="text-gray-500">Gestiona tu información personal y de contacto</p>
                </div>
            </div>

            <div className="card p-8">
                <ProfileForm user={user} />
            </div>

            <div className="mt-8 card p-6 border-l-4 border-l-amber-500 bg-amber-50">
                <h3 className="font-bold text-amber-800 mb-1">Nota de Seguridad</h3>
                <p className="text-sm text-amber-700">
                    Tu información de contacto (teléfono y ciudad) será visible para las personas que escaneen el código QR de tus mascotas si las marcas como extraviadas. Asegúrate de que sea correcta.
                </p>
            </div>
        </div>
    );
}
