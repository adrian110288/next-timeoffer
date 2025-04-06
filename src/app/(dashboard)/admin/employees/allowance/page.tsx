import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/prisma";
import AllowanceForm from "@/components/AllowanceForm";

const page = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const user = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        include: {
            company: true,
        },
    });

    if (!user) {
        redirect("/");
    }

    const employeeAllowances = await prisma.user.findMany({
        where: {
            companyId: user.company.id,
        },
        orderBy: {
            lastName: "asc",
        },
        select: {
            firstName: true,
            lastName: true,
            id: true,
            email: true,
            department: true,
            role: true,
            availableDays: true,
        },
    });

    return (
        <div className="space-y-8 mt-12">
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold">
                        Holiday allowance management
                    </h1>
                    <p className="text-gray-500">
                        Manage employee holiday allowances
                    </p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        {!employeeAllowances ||
                        employeeAllowances?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <p className="text-gray-500">
                                    No employees found.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>
                                                Available Days
                                            </TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeeAllowances?.map((employee) => (
                                            <TableRow key={employee.id}>
                                                <TableCell>
                                                    {employee.firstName}{" "}
                                                    {employee.lastName}
                                                </TableCell>
                                                <TableCell>
                                                    {employee.email}
                                                </TableCell>
                                                <TableCell>
                                                    {employee.department}
                                                </TableCell>
                                                <TableCell>
                                                    {employee.role}
                                                </TableCell>
                                                <TableCell>
                                                    {employee.availableDays}
                                                </TableCell>
                                                <TableCell>
                                                    <AllowanceForm
                                                        employeeId={employee.id}
                                                        employeeName={`${employee.firstName} ${employee.lastName}`}
                                                        currentAllowance={
                                                            employee.availableDays
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default page;
