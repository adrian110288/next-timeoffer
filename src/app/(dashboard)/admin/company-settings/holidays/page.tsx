import CompanyHolidaysForm from "@/components/CompanyHolidaysForm";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
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
        redirect("/sign-in");
    }

    const companyHolidays = await prisma.companyHoliday.findMany({
        where: {
            companyId: user.companyId,
        },
    });

    return <CompanyHolidaysForm initialHolidays={companyHolidays} />;
};

export default page;
