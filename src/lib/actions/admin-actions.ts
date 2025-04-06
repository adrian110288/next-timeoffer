"use server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function updateCompanyProfile({
    name,
    website,
    logo,
}: {
    name: string;
    website?: string;
    logo?: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
            select: {
                companyId: true,
                role: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        await prisma.company.update({
            where: {
                id: user.companyId,
            },
            data: {
                name,
                website,
                logo,
            },
        });

        revalidatePath("/admin/company-settings/profile");
        revalidatePath("/admin/company-settings");

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update company profile");
    }
}

export async function updateCompanyWorkingDays(workingDays: string[]) {
    try {
        const { userId, sessionClaims } = await auth();

        console.log(userId, sessionClaims);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
            select: {
                role: true,
                companyId: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        await prisma.company.update({
            where: {
                id: user.companyId,
            },
            data: {
                workingDays: JSON.stringify(workingDays),
            },
        });
        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update company working days");
    }
}