"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendChatMessage(sessionId: string, senderType: "FINDER" | "OWNER", content: string) {
    if (!content.trim()) return { success: false };

    const message = await prisma.chatMessage.create({
        data: {
            sessionId,
            senderType,
            content,
        }
    });

    // Update session timestamp
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
    });

    revalidatePath(`/chat/${sessionId}`);

    return { success: true, messageId: message.id };
}

export async function getNewMessages(sessionId: string, lastMessageId: string) {
    // This could be used for simple polling
    const messages = await prisma.chatMessage.findMany({
        where: {
            sessionId,
            id: {
                gt: lastMessageId
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    return messages;
}
