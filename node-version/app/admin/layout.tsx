import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) redirect("/");

    // Robust check for ADMIN role in DB
    const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id }
    });

    if (profile?.role !== "ADMIN" && session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="bg-gray-50 min-h-screen pt-12 pb-24">
            <div className="container">
                <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                    <div>
                        <span className="text-primary font-black uppercase tracking-widest text-xs mb-2 block">
                            Panel Administrativo
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight italic">
                            Localipet <span className="text-gray-400 font-medium">Control</span>
                        </h1>
                    </div>
                </div>

                <AdminTabs />

                {children}
            </div>
        </div>
    );
}
