import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import CompanyProfileForm from "@/components/CompanyProfileForm";

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
            role: true,
            companyId: true,
        },
    });

    if (!user) {
        redirect("/onboarding");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    const company = await prisma.company.findUnique({
        where: {
            id: user.companyId,
        },
        select: {
            id: true,
            name: true,
            logo: true,
            website: true,
        },
    });

    if (!company) {
        redirect("/onboarding");
    }

    return (
        <div className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Company Profile</h1>
                    <p className="text-gray-500">Update your company profile</p>
                </div>
                <Button asChild variant={"outline"}>
                    <Link href={`/admin/company-settings`}>
                        Back to settings
                    </Link>
                </Button>
            </div>
            <CompanyProfileForm
                initialData={{
                    name: company.name,
                    website: company.website || "",
                    logo: company.logo || "",
                }}
            />
        </div>
    );
};

export default page;
