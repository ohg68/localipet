"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getVetDashboard(orgId: string) {
    const session = await auth();
    if (!session || (session.user.role !== "VET" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    // 1. CRM: Clients and Animals
    const clients = await prisma.organizationClient.findMany({
        where: { organizationId: orgId, isActive: true },
        include: {
            user: {
                include: {
                    animals: {
                        include: {
                            vaccinations: true,
                            qrCode: true
                        }
                    }
                }
            }
        }
    });

    // 2. Alarms: Upcoming Vaccinations
    const upcomingVaccines = await prisma.vaccination.findMany({
        where: {
            nextDueDate: { gte: today, lte: nextMonth },
            animal: {
                owner: {
                    orgClientMemberships: {
                        some: { organizationId: orgId }
                    }
                }
            }
        },
        include: { animal: true },
        orderBy: { nextDueDate: "asc" }
    });

    // 3. Consumption Predictions
    const animals = clients.flatMap(c => c.user.animals);
    const consumptionAlerts = animals.filter(animal => {
        const a = animal as any;
        if (!a.dailyFoodIntakeGrams || !a.lastFoodPurchaseDate || !a.foodPackageSizeKg) return false;

        const packageGrams = Number(a.foodPackageSizeKg) * 1000;
        const totalDaysIntake = packageGrams / a.dailyFoodIntakeGrams;

        const lastPurchase = new Date(a.lastFoodPurchaseDate);
        const estimatedOutDate = new Date(lastPurchase);
        estimatedOutDate.setDate(lastPurchase.getDate() + totalDaysIntake);

        // Alert if it runs out in less than 7 days
        const alertThreshold = new Date();
        alertThreshold.setDate(today.getDate() + 7);

        return estimatedOutDate <= alertThreshold;
    });

    const vaccineAlerts = upcomingVaccines.map(v => ({
        id: v.id,
        animalId: v.animalId,
        animalName: v.animal.name,
        ownerEmail: v.animal.ownerId, // this is id in our join
        ownerId: v.animal.ownerId,
        type: "VACCINE" as const,
        title: v.name,
        dateLabel: v.nextDueDate?.toLocaleDateString()
    }));

    const consumptionAlertsFinal = consumptionAlerts.map(a => {
        const animal = a as any;
        return {
            id: animal.id,
            animalId: animal.id,
            animalName: animal.name,
            ownerEmail: animal.ownerId,
            ownerId: animal.ownerId,
            type: "FOOD" as const,
            title: animal.foodBrand || "Alimento"
        };
    });

    return {
        clientCount: clients.length,
        animalCount: animals.length,
        alerts: [...vaccineAlerts, ...consumptionAlertsFinal]
    };
}

export async function registerPetOrder(animalId: string, orgId: string, foodBrand: string, packageSizeKg: number, gramsPerDay: number) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    await (prisma.animal as any).update({
        where: { id: animalId },
        data: {
            foodBrand,
            foodPackageSizeKg: packageSizeKg,
            dailyFoodIntakeGrams: gramsPerDay,
            lastFoodPurchaseDate: new Date()
        }
    });

    revalidatePath("/vet/dashboard");
    return { success: true };
}

export async function getVetCampaigns(orgId: string) {
    return await (prisma as any).vetCampaign.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: { endDate: "asc" }
    });
}

export async function createCommunicationLog(data: {
    organizationId: string;
    userId: string;
    animalId?: string;
    type: string;
    channel: string;
    content: string;
    status: string;
    sentAt: Date;
}) {
    const session = await auth();
    if (!session || (session.user.role !== "VET" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    return await (prisma as any).communicationLog.create({
        data
    });
}
