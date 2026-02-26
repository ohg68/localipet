import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import AdminQRGenerator from "@/components/AdminQRGenerator";
import { getUnassignedQRCodes } from "@/app/actions/admin";
import { QrCode as QrIcon } from "lucide-react";

export default async function AdminQRPage() {
    const session = await auth();

    // Strict admin check
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "ADMIN") notFound();

    const unassignedCodes = await getUnassignedQRCodes();

    return (
        <div className="container pb-20">
            <header className="py-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                        <QrIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Constructor de Tags</h1>
                        <p className="text-gray-500 font-medium italic">Herramienta exclusiva de administración para producción masiva.</p>
                    </div>
                </div>
            </header>

            <AdminQRGenerator initialCodes={unassignedCodes} />
        </div>
    );
}
