"use server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "../prisma";
import { revalidatePath } from "next/cache";

export async function createEmployee(
    department: string | undefined,
    clerkId: string,
    invitationCode: string
) {
    try {
        const user = await (await clerkClient()).users.getUser(clerkId);
        if (!user || !user.firstName || !user.lastName) {
            throw new Error("User not found");
        }

        const code = await prisma.code.findFirst({
            where: {
                code: invitationCode,
                used: false,
            },
        });

        if (!code) {
            throw new Error("Invalid invitation code");
        }

        await (
            await clerkClient()
        ).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: "EMPLOYEE",
                companyId: code.companyId,
            },
        });

        await prisma.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                role: "EMPLOYEE",
                department: department || null,
                companyId: code.companyId,
            },
        });

        await prisma.code.update({
            where: {
                id: code.id,
            },
            data: {
                used: true,
            },
        });

        revalidatePath("/onboarding");

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
        };
    }
}

export async function createAdmin(
    companyName: string,
    companyWebsite: string,
    companyLogo: string,
    clerkId: string
) {
    try {
        const user = await (await clerkClient()).users.getUser(clerkId);

        if (!user || !user.firstName) {
            throw new Error("User not found");
        }

        const company = await prisma.company.create({
            data: {
                name: companyName,
                website: companyWebsite,
                logo: companyLogo,
            },
        });

        await (
            await clerkClient()
        ).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: "ADMIN",
                companyId: company.id,
            },
        });

        await prisma.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                firstName: user.firstName,
                lastName: user.lastName || "Lesniak",
                role: "ADMIN",
                company: {
                    connect: {
                        id: company.id,
                    },
                },
            },
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
        };
    }
}
