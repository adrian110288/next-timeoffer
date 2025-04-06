"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "../prisma";
import { TimeOffType } from "@prisma/client";

export async function createTimeOffRequest(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        });

        if (!dbUser) {
            throw new Error("User not found");
        }

        const startDate = formData.get("startDate");
        const endDate = formData.get("endDate");
        const type = formData.get("type") as string;
        const reason = formData.get("reason") as string;
        const workingDays =
            parseInt(formData.get("workingDays") as string) || 0;

        if (!startDate || !endDate || !type) {
            throw new Error("Missing required fields");
        }

        const timeOffRequest = await prisma.timeOffRequest.create({
            data: {
                startDate: new Date(startDate as string),
                endDate: new Date(endDate as string),
                type: type as TimeOffType,
                reason,
                employeeId: dbUser.id,
                workingDaysCount: workingDays,
            },
        });

        return timeOffRequest;
    } catch (error) {
        console.error("Error creating time off request:", error);
        throw new Error("An error occurred while creating the request");
    }
}
