"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Species } from "@prisma/client";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { join } from "path";

async function saveFile(file: File | null): Promise<string | null> {
    console.log("Saving file:", file?.name, "Size:", file?.size, "Type:", file?.type);

    if (!file || file.size === 0 || !(file instanceof File)) {
        console.log("No valid file provided or empty.");
        return null;
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const path = join(process.cwd(), "public", "uploads", fileName);

        console.log("Writing file to:", path);
        await writeFile(path, buffer);
        console.log("File saved successfully:", `/uploads/${fileName}`);
        return `/uploads/${fileName}`;
    } catch (error) {
        console.error("Error in saveFile:", error);
        throw new Error("Error al guardar el archivo en el servidor");
    }
}

export async function createAnimal(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const name = formData.get("name") as string;
    const species = formData.get("species") as Species;
    const breed = formData.get("breed") as string;
    const microchipId = formData.get("microchipId") as string;

    // Handle File Upload
    const photoFile = formData.get("photo") as File;
    const photoPath = await saveFile(photoFile);

    const qrToken = formData.get("qrToken") as string;

    let qrCodeData;

    if (qrToken) {
        const existingQR = await prisma.qRCode.findUnique({
            where: { token: qrToken }
        });

        if (!existingQR || existingQR.animalId !== null) {
            throw new Error("El código del tag no es válido o ya está en uso.");
        }

        qrCodeData = {
            connect: { id: existingQR.id }
        };
    } else {
        const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let shortCode = "";
        let isUnique = false;

        while (!isUnique) {
            shortCode = "";
            for (let i = 0; i < 6; i++) {
                shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            const existing = await prisma.qRCode.findUnique({
                where: { shortCode }
            });

            if (!existing) isUnique = true;
        }

        qrCodeData = {
            create: {
                token: nanoid(16),
                shortCode,
            }
        };
    }

    const animal = await prisma.animal.create({
        data: {
            name,
            species,
            breed,
            microchipId,
            photo: photoPath,
            ownerId: session.user.id,
            qrCode: qrCodeData
        },
    });

    revalidatePath("/animals");
    revalidatePath("/dashboard");
    redirect(`/animals/${animal.id}`);
}

export async function toggleAnimalLostStatus(animalId: string, currentStatus: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    await prisma.animal.update({
        where: { id: animalId, ownerId: session.user.id },
        data: {
            isLost: !currentStatus,
            lostSince: !currentStatus ? new Date() : null
        },
    });

    revalidatePath(`/animals/${animalId}`);
    revalidatePath("/animals");
    revalidatePath("/dashboard");
}

export async function updateAnimal(animalId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const name = formData.get("name") as string;
    const species = formData.get("species") as Species;
    const breed = formData.get("breed") as string;
    const microchipId = formData.get("microchipId") as string;

    // Handle File Upload
    const photoFile = formData.get("photo") as File;
    const photoPath = await saveFile(photoFile);

    const updateData: any = {
        name,
        species,
        breed,
        microchipId,
    };

    if (photoPath) {
        updateData.photo = photoPath;
    }

    await prisma.animal.update({
        where: { id: animalId, ownerId: session.user.id },
        data: updateData,
    });

    revalidatePath(`/animals/${animalId}`);
    revalidatePath("/animals");
    revalidatePath("/dashboard");
    redirect(`/animals/${animalId}`);
}

export async function linkAnimalToTag(animalId: string, qrToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    // Verify ownership
    const animal = await prisma.animal.findUnique({
        where: { id: animalId, ownerId: session.user.id },
        include: { qrCode: true }
    });

    if (!animal) throw new Error("Mascota no encontrada");

    // Verify tag is unassigned
    const qrCode = await prisma.qRCode.findUnique({
        where: { token: qrToken }
    });

    if (!qrCode || (qrCode as any).animalId !== null) {
        throw new Error("El código del tag no es válido o ya está en uso.");
    }

    // Delete existing QR if any (a pet should only have one active QR)
    if (animal.qrCode) {
        await prisma.qRCode.delete({
            where: { id: animal.qrCode.id }
        });
    }

    // Link new QR
    await prisma.qRCode.update({
        where: { id: (qrCode as any).id },
        data: { animalId: animal.id }
    });

    revalidatePath(`/animals/${animalId}`);
    revalidatePath("/animals");
    redirect(`/animals/${animalId}`);
}
