import Link from "next/link";
import { Button } from "@/components/ui/button";
import CompanyWorkingDaysForm from "@/components/CompanyWorkingDaysForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

const page = async () => {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/");
    }

    if (sessionClaims?.metadata?.role !== "ADMIN") {
        redirect("/admin/company-settings");
    }

    console.log(`sessionClaims`, sessionClaims);

    const user = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        select: {
            companyId: true,
        },
    });

    console.log(`user`, user);

    const company = await prisma.company.findUnique({
        where: {
            id: user?.companyId,
        },
        select: {
            workingDays: true,
        },
    });

    console.log(`company`, company);

    const initialWorkingDays = JSON.parse(company?.workingDays || "[]");

    console.log(`initialWorkingDays`, initialWorkingDays);

    return (
        <div className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Working Days</h1>
                    <p className="text-gray-500">
                        Configure your company&apos;s working days
                    </p>
                </div>
                <Button asChild variant={"outline"}>
                    <Link href="/admin/company-settings">Back to settings</Link>
                </Button>
            </div>
            <CompanyWorkingDaysForm initialWorkingDays={initialWorkingDays} />
        </div>
    );
};

export default page;
