import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const page = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const adminUser = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        select: {
            companyId: true,
            company: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!adminUser) {
        redirect("/onboarding");
    }

    const companyId = adminUser.companyId;
    const companyName = adminUser.company?.name;

    const pendingRequestsCount = await prisma.timeOffRequest.count({
        where: {
            employee: {
                companyId: companyId,
            },
            status: "PENDING",
        },
    });

    const approvedRequestsCount = await prisma.timeOffRequest.count({
        where: {
            employee: {
                companyId: companyId,
            },
            status: "APPROVED",
        },
    });

    const employeeCount = await prisma.user.count({
        where: {
            companyId,
            role: {
                in: ["EMPLOYEE", "ADMIN"],
            },
        },
    });

    const activeInvitationCodesCount = await prisma.code.count({
        where: {
            used: false,
            companyId,
        },
    });

    const data = [
        {
            title: "Pending Requests",
            data: pendingRequestsCount,
        },
        {
            title: "Approved Requests",
            data: approvedRequestsCount,
        },
        {
            title: "Employee Count",
            data: employeeCount,
        },
        {
            title: "Active Invitation Codes",
            data: activeInvitationCodesCount,
        },
    ];

    return (
        <div className="space-y-8 mt-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">{companyName} Dashboard</h1>
                <p className="text-gray-500">
                    Manage your company and employees
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {data?.map((item) => {
                    return (
                        <Card key={item.title}>
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-500">
                                    {item.title}
                                </p>
                                <h3 className="text-2xl font-semibold">
                                    {item.data}
                                </h3>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Time Off Requests</CardTitle>
                        <CardDescription>
                            Manage employee time off requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <Button asChild>
                                <Link href="/admin/time-off-requests">
                                    View all requests
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Company Settings</CardTitle>
                        <CardDescription>
                            Manage company configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <Button asChild>
                                <Link href="/admin/company-settings">
                                    General settings
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/admin/company-settings/holidays">
                                    Company Holidays
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/admin/company-settings/working-days">
                                    Working Days
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Team management</CardTitle>
                        <CardDescription>
                            Manage your company&apos;s team
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <Button asChild>
                                <Link href="/admin/employees">
                                    View Employees
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/admin/invitation-codes">
                                    Invitation Codes
                                </Link>
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                                You have {activeInvitationCodesCount} active
                                invitation code
                                {activeInvitationCodesCount !== 1 ? "s" : ""}.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default page;
