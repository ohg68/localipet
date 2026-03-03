import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import { MessageSquare } from "lucide-react";
import VetChatClient from "@/components/VetChatClient";
import { redirect } from "next/navigation";

export default async function VetChatPage({
    searchParams
}: {
    searchParams: { orgId?: string };
}) {
    const session = await auth();
    if (!session) redirect("/");

    let orgId = searchParams.orgId;

    if (!orgId) {
        // Fallback to first org
        const firstMembership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id }
        });
        if (firstMembership) {
            orgId = firstMembership.organizationId;
        } else {
            return <div>No autorizado</div>;
        }
    }

    const locale = await getLocale();
    const t = translations[locale];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-gray-900 italic tracking-tight flex items-center gap-4">
                        <MessageSquare className="w-10 h-10 text-primary" />
                        Chat Interactivo App
                    </h2>
                    <p className="text-gray-500 font-medium italic mt-2 text-lg">
                        Maneja las conversaciones y solicitudes que envían los dueños desde la App Móvil.
                    </p>
                </div>
            </div>

            {/* Chat Interface */}
            <VetChatClient orgId={orgId} locale={locale} />
        </div>
    );
}
