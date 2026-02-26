"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addWeightRecord(animalId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const weightKg = parseFloat(formData.get("weightKg") as string);
    const dateRecorded = new Date(formData.get("dateRecorded") as string);
    const notes = formData.get("notes") as string;

    if (isNaN(weightKg)) throw new Error("Peso inválido");

    await prisma.weightRecord.create({
        data: {
            animalId,
            weightKg,
            dateRecorded,
            notes,
        },
    });

    // Update main animal weight as the latest record
    const latestRecord = await prisma.weightRecord.findFirst({
        where: { animalId },
        orderBy: { dateRecorded: 'desc' },
    });

    if (latestRecord) {
        await prisma.animal.update({
            where: { id: animalId },
            data: { weightKg: latestRecord.weightKg },
        });
    }

    revalidatePath(`/animals/${animalId}`);
}

export async function addVaccination(animalId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const name = formData.get("name") as string;
    const dateAdministered = new Date(formData.get("dateAdministered") as string);
    const nextDueDate = formData.get("nextDueDate") ? new Date(formData.get("nextDueDate") as string) : null;
    const notes = formData.get("notes") as string;

    await prisma.vaccination.create({
        data: {
            animalId,
            name,
            dateAdministered,
            nextDueDate,
            notes,
        },
    });

    revalidatePath(`/animals/${animalId}`);
}
