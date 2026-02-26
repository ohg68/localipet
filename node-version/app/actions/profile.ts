"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;

    // Update User
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            firstName,
            lastName,
        },
    });

    // Update Profile
    await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
            phone,
            address,
            city,
        },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/animals");

    return { success: true };
}
