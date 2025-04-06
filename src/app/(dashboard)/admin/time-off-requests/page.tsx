import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Table,
    TableHead,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const page = async () => {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const { companyId } = sessionClaims.metadata;

    const requests = await prisma.timeOffRequest.findMany({
        where: {
            employee: {
                companyId: companyId,
            },
        },
        include: {
            employee: true,
            manager: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="space-y-8 mt-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">Time Off Requests</h1>
                <p className="text-gray-500">
                    View and manage all time off requests
                </p>
            </div>
            <Card>
                <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Approved By</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests?.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        {request.employee.firstName}{" "}
                                        {request.employee.lastName}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(request.startDate) +
                                            " - " +
                                            formatDate(request.endDate)}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {request.type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                request.status === "PENDING"
                                                    ? "secondary"
                                                    : request.status ===
                                                      "APPROVED"
                                                    ? "default"
                                                    : "destructive"
                                            }
                                        >
                                            {request.status.charAt(0) +
                                                request.status
                                                    .slice(1)
                                                    .toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {request.manager
                                            ? `${request.manager.firstName} ${request.manager.lastName}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(request.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="link" asChild>
                                            <Link
                                                href={`/admin/time-off-requests/${request.id}`}
                                            >
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default page;
