import TimeOffRequestForm from "@/components/TimeOffRequestForm";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const user = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        select: {
            companyId: true,
        },
    });

    if (!user) {
        redirect("/onboarding");
    }

    const requests = await prisma.timeOffRequest.findMany({
        where: {
            employeeId: userId,
        },
    });

    const companyHolidays = await prisma.companyHoliday.findMany({
        where: {
            companyId: user.companyId,
        },
    });

    return (
        <TimeOffRequestForm
            existingRequests={requests}
            companyHolidays={companyHolidays}
        />
    );
};

export default page;
