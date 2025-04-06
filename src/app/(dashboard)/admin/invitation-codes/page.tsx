import InvitationCodes from "@/components/InvitationCodes";
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
            role: true,
        },
    });

    if (!user || user.role !== "ADMIN") {
        redirect("/");
    }

    const codes = await prisma.code.findMany({
        where: {
            companyId: user.companyId,
        },
        orderBy: {
            used: "asc",
        },
    });

    return <InvitationCodes initialCodes={codes} />;
};

export default page;
