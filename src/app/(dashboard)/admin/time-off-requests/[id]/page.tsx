import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { formatDate, calculateDays } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ApproveRejectButtons from "@/components/ApproveRejectButtons";

const page = async ({
    params,
}: {
    params: {
        id: string;
    };
}) => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const { id } = await params;

    const request = await prisma.timeOffRequest.findUnique({
        where: {
            id,
        },
        include: {
            employee: true,
        },
    });

    if (!request) {
        return notFound();
    }

    const employee = await prisma.user.findUnique({
        where: {
            id: request?.employeeId,
        },
        include: {
            company: true,
        },
    });

    const manager = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        include: {
            company: true,
        },
    });

    if (manager?.companyId !== employee?.companyId) {
        redirect("/admin/time-off-requests");
    }

    const daysCount = calculateDays(request.startDate, request.endDate);

    return (
        <div className="space-y-8 mt-12">
            <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                    <Link href="/admin/time-off-requests">
                        Back to Time Off Requests
                    </Link>
                    <h1 className="text-3xl font-bold">
                        Time off request details
                    </h1>
                </div>
                {request.status === "PENDING" && (
                    <ApproveRejectButtons id={id} />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <h3 className="text-xl font-semibold leading-none tracking-tight">
                            Request Information
                        </h3>
                    </div>
                    <div className="px-6 pb-4">
                        <dl className="grid grid-cols-2 gap-4">
                            <dt className="text-sm font-medium text-gray-500">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        request.status === "PENDING"
                                            ? "secondary"
                                            : request.status === "APPROVED"
                                            ? "default"
                                            : "destructive"
                                    }
                                >
                                    {request.status.charAt(0) +
                                        request.status.charAt(1)}
                                </Badge>
                            </dd>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Type
                                </dt>
                                <dd>{request.type}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Start Date
                                </dt>
                                <dd>{formatDate(request.startDate)}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    End Date
                                </dt>
                                <dd>{formatDate(request.endDate)}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Duration
                                </dt>
                                <dd>
                                    {daysCount} day{daysCount !== 1 ? "s" : ""}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Working days
                                </dt>
                                <dd>
                                    {request.workingDaysCount} day
                                    {request.workingDaysCount !== 1 ? "s" : ""}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Created
                                </dt>
                                <dd>{formatDate(request.createdAt)}</dd>
                            </div>
                            {request.reason && (
                                <div className="grid col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Reason
                                    </dt>
                                    <dd>{request.reason}</dd>
                                </div>
                            )}
                            {request.notes && (
                                <div className="grid col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Notes
                                    </dt>
                                    <dd>{request.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <h3 className="text-xl font-semibold leading-none tracking-tight">
                            Employee Information
                        </h3>
                    </div>
                    <div className="px-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Name
                                </dt>
                                <dd>
                                    {request.employee.firstName}{" "}
                                    {request.employee.lastName}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Email
                                </dt>
                                <dd>{request.employee.email}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Role
                                </dt>
                                <dd>{request.employee.role}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Department
                                </dt>
                                <dd>
                                    {request.employee.department
                                        ? request.employee.department
                                        : "N/A"}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default page;
