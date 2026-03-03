import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import AdminQRGenerator from "@/components/AdminQRGenerator";
import { getUnassignedQRCodes } from "@/app/actions/admin";
import { QrCode as QrIcon } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";

export default async function AdminQRPage() {
    const session = await auth();
    const locale = await getLocale();
    const t = translations[locale];

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
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t.admin.qrGenerator.title}</h1>
                        <p className="text-gray-500 font-medium italic">{t.admin.qrGenerator.description}</p>
                    </div>
                </div>
            </header>

            <AdminQRGenerator initialCodes={unassignedCodes} locale={locale} />
        </div>
    );
}
