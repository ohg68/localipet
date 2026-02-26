import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditAnimalForm from "@/components/EditAnimalForm";

export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const animal = await prisma.animal.findUnique({
        where: { id },
    });

    if (!animal) {
        notFound();
    }

    if (animal.ownerId !== session?.user?.id) {
        redirect("/animals");
    }

    return (
        <div className="container max-w-2xl">
            <Link href={`/animals/${animal.id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al detalle</span>
            </Link>

            <div className="card p-8">
                <h1 className="text-2xl font-bold mb-6">Editar Mascota</h1>
                <EditAnimalForm animal={animal} />
            </div>
        </div>
    );
}
