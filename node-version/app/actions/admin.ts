"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function generateQRBatch(quantity: number) {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Only admins can generate QR batches.");
    }

    if (quantity <= 0 || quantity > 1000) {
        throw new Error("Invalid quantity. Max 1000 per batch.");
    }

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters (I, O, 0, 1)

    const generateShortCode = () => {
        let result = "";
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const batchData = [];
    const usedShortCodes = new Set();

    // Get existing shortcodes from DB to avoid collisions
    const existingQRs = await prisma.qRCode.findMany({
        select: { shortCode: true }
    });
    existingQRs.forEach(qr => usedShortCodes.add(qr.shortCode));

    while (batchData.length < quantity) {
        const token = nanoid(10);
        const shortCode = generateShortCode();

        if (!usedShortCodes.has(shortCode)) {
            batchData.push({ token, shortCode });
            usedShortCodes.add(shortCode);
        }
    }

    try {
        await prisma.qRCode.createMany({
            data: batchData.map(item => ({
                token: item.token,
                shortCode: item.shortCode,
                isActive: true,
            })),
        });

        revalidatePath("/admin/qr-generator");
        return { success: true, count: batchData.length };
    } catch (error) {
        console.error("Error generating QR batch:", error);
        throw new Error("Failed to generate QR batch.");
    }
}

export async function getUnassignedQRCodes() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const qrCodes = await prisma.qRCode.findMany({
        where: { animalId: null },
        orderBy: { createdAt: "desc" },
        take: 1000,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return qrCodes.map(qr => ({
        token: qr.token,
        shortCode: (qr as any).shortCode,
        url: `${baseUrl}/s/${qr.token}`,
        createdAt: qr.createdAt
    }));
}

export async function lookupShortCode(code: string) {
    const cleanCode = code.replace("#", "").toUpperCase().trim();

    if (cleanCode.length < 5 || cleanCode.length > 10) {
        throw new Error("El código debe tener entre 5 y 10 caracteres.");
    }

    const qrCode = await prisma.qRCode.findUnique({
        where: { shortCode: cleanCode } as any
    });

    if (!qrCode) {
        throw new Error("Código no encontrado.");
    }

    return qrCode.token;
}

export async function getUsersList() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.user.findMany({
        include: {
            profile: true,
            _count: {
                select: { animals: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getAnimalsList() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.animal.findMany({
        include: {
            owner: {
                select: { email: true, firstName: true, lastName: true }
            },
            qrCode: {
                select: { shortCode: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getVetsList() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.organization.findMany({
        orderBy: { createdAt: "desc" }
    });
}

export async function toggleAnimalLost(animalId: string, isLost: boolean) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.animal.update({
        where: { id: animalId },
        data: { isLost, lostSince: isLost ? new Date() : null }
    });
    revalidatePath("/admin/animals");
    return { success: true };
}

export async function toggleAnimalActive(animalId: string, isActive: boolean) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.animal.update({
        where: { id: animalId },
        data: { isActive }
    });
    revalidatePath("/admin/animals");
    return { success: true };
}

export async function toggleUserRole(userId: string, currentRole: string) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    const newRole = currentRole === "ADMIN" ? "OWNER" : "ADMIN";

    await prisma.profile.update({
        where: { userId },
        data: { role: newRole as any }
    });

    revalidatePath("/admin/users");
    return { success: true };
}

export async function unlinkTag(animalId: string) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.qRCode.update({
        where: { animalId },
        data: { animalId: null }
    });
    revalidatePath("/admin/animals");
    return { success: true };
}
