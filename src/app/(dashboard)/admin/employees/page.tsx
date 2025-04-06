import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const Page = async () => {
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

    console.log(` user is ${user}`);

    if (!user?.companyId) {
        redirect("/onboarding");
    }

    const users = await prisma.user.findMany({
        where: {
            companyId: user.companyId,
        },
        orderBy: {
            lastName: "asc",
        },
    });

    return (
        <div className="space-y-8 mt-12">
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold">Employees</h1>
                    <p className="text-gray-500">Manage employee accounts</p>
                </div>
                <Card>
                    <CardContent>
                        {users?.length === 0 ? (
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
                                            <TableHead>Role</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users?.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    {user.firstName}{" "}
                                                    {user.lastName}
                                                </TableCell>
                                                <TableCell>
                                                    {user.email}
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {user.role}
                                                </TableCell>
                                                <TableCell>
                                                    {user.department || "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="link"
                                                        asChild
                                                    >
                                                        <Link href="/admin/employees/allowance">
                                                            View
                                                        </Link>
                                                    </Button>
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

export default Page;
