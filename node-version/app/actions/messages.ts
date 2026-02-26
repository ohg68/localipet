"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";

export async function sendFinderMessage(qrCodeId: string, formData: FormData) {
    const senderName = formData.get("senderName") as string;
    const senderPhone = formData.get("senderPhone") as string;
    const message = formData.get("message") as string;
    const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
    const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

    if (!senderName || !message) {
        throw new Error("Nombre y mensaje son obligatorios");
    }

    // Get QR and Animal/Owner info
    const qr = await prisma.qRCode.findUnique({
        where: { id: qrCodeId },
        include: {
            animal: {
                include: {
                    owner: {
                        include: {
                            profile: true
                        }
                    }
                }
            }
        }
    });

    if (!qr || !qr.animal) {
        throw new Error("Código QR no válido");
    }

    const animal = qr.animal;
    const owner = animal.owner;
    const profile = owner.profile;

    // Create record in database (Legacy FinderMessage for historical tracking)
    await prisma.finderMessage.create({
        data: {
            qrCodeId,
            senderName,
            senderPhone,
            message,
            latitude,
            longitude,
        }
    });

    // Create a ChatSession for unified communication
    const chatSession = await prisma.chatSession.create({
        data: {
            qrCodeId,
            finderName: senderName,
            finderPhone: senderPhone,
        }
    });

    // Add first message to the session
    await prisma.chatMessage.create({
        data: {
            sessionId: chatSession.id,
            senderType: "FINDER",
            content: message,
        }
    });

    // Notify Owner via External Channels
    if (profile?.phone) {
        let notificationMsg = `¡Hola ${owner.firstName || 'dueño de ' + animal.name}! 🐾\n\n`;
        notificationMsg += `${senderName} ha encontrado a ${animal.name}.\n\n`;
        notificationMsg += `Mensaje: "${message}"\n`;

        if (senderPhone) {
            notificationMsg += `Contacto del buscador: ${senderPhone}\n`;
        }

        if (latitude && longitude) {
            notificationMsg += `📍 Ubicación: https://www.google.com/maps?q=${latitude},${longitude}\n`;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const chatUrl = `${baseUrl}/chat/${chatSession.id}`;
        notificationMsg += `\n💬 Puedes conversar con el buscador en tiempo real aquí: ${chatUrl}`;

        await sendNotification({
            to: profile.phone,
            message: notificationMsg,
            type: "whatsapp"
        });
    }

    revalidatePath("/dashboard");
    revalidatePath("/messages");
    revalidatePath(`/animals/${animal.id}`);

    return {
        success: true,
        chatSessionId: chatSession.id
    };
}
