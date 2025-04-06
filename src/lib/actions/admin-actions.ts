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

export async function deleteCompanyHoliday(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
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
            throw new Error("User not found in database");
        }

        if (user.role !== "ADMIN") {
            throw new Error("Only admins can delete company holidays");
        }

        const existingHoliday = await prisma.companyHoliday.findUnique({
            where: {
                id,
            },
            select: {
                companyId: true,
            },
        });

        if (!existingHoliday) {
            throw new Error("Holiday not found in database");
        }

        if (existingHoliday.companyId !== user.companyId) {
            throw new Error(
                "You can only delete holidays for your own company"
            );
        }

        await prisma.companyHoliday.delete({
            where: {
                id,
            },
        });

        revalidatePath("/admin/company-settings/holidays");

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to delete company holiday");
    }
}

export async function addCompanyHoliday({
    name,
    date,
    isRecurring,
}: {
    name: string;
    date: Date;
    isRecurring: boolean;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorised. Please sign in.");
    }

    try {
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
            throw new Error("User not found in database");
        }

        if (user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const holiday = await prisma.companyHoliday.create({
            data: {
                name,
                date,
                isRecurring,
                companyId: user.companyId,
            },
        });

        revalidatePath("/admin/company-settings/holidays");

        return holiday;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to add company holiday");
    }
}

export async function updateCompanyHoliday({
    id,
    name,
    date,
    isRecurring,
}: {
    id: string;
    name: string;
    date: Date;
    isRecurring: boolean;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorised. Please sign in.");
    }

    try {
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
            throw new Error("User not found in database");
        }

        if (user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const holiday = await prisma.companyHoliday.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!holiday) {
            throw new Error("Holiday not found in database");
        }

        if (holiday.companyId !== user.companyId) {
            throw new Error(
                "You can only update holidays for your own company"
            );
        }

        const updatedHoliday = await prisma.companyHoliday.update({
            where: { id },
            data: {
                name,
                date,
                isRecurring,
            },
        });

        revalidatePath("/admin/company-settings/holidays");

        return updatedHoliday;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to add company holiday");
    }
}

export async function updateEmployeeAllowance({
    employeeId,
    availableDays,
}: {
    employeeId: string;
    availableDays: number;
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { error: "Unauthorised" };
        }

        const adminUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        });

        if (!adminUser || adminUser.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }
        await prisma.user.update({
            where: {
                id: employeeId,
            },
            data: {
                availableDays,
            },
        });

        revalidatePath("/admin/employees/allowance");

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update employee allowance");
    }
}
