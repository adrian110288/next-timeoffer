"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { createAdmin, createEmployee } from "@/lib/actions/onboarding";
import { toast } from "sonner";

const employeeSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(55),
    lastName: z.string().min(1, "Last name is required").max(55),
    email: z.string().email("Invalid email address").max(100),
    department: z.string().optional(),
    invitationCode: z
        .string()
        .length(6, "Invitation code must be 6 characters long"),
});

const adminSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(55),
    lastName: z.string().min(1, "Last name is required").max(55),
    email: z.string().email("Invalid email address").max(100),
    companyName: z.string().min(1, "Company name is required").max(100),
    companyWebsite: z
        .string()
        .url("Invalid website URL")
        .optional()
        .or(z.literal("")),
    companyLogo: z.string().url().optional().or(z.literal("")),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;
type AdminFormValues = z.infer<typeof adminSchema>;

interface OnboardingFormProps {
    userEmail: string;
    firstName: string;
    lastName: string;
}

const OnboardingForm = ({
    userEmail,
    firstName,
    lastName,
}: OnboardingFormProps) => {
    const { user, isLoaded } = useUser();
    const [accountType, setAccountType] = useState<"admin" | "employee">(
        "employee"
    );
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const employeeForm = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            firstName,
            lastName,
            email: userEmail,
            department: "",
            invitationCode: "",
        },
    });

    const adminForm = useForm<AdminFormValues>({
        resolver: zodResolver(adminSchema),
        defaultValues: {
            firstName,
            lastName,
            email: userEmail,
            companyName: "",
            companyWebsite: "",
            companyLogo: "",
        },
    });

    const handleEmployeeSubmit = async (data: EmployeeFormValues) => {
        if (!user) {
            return;
        }

        let canRedirect = false;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await createEmployee(
                data.department || undefined,
                user.id,
                data.invitationCode
            );

            console.log(response);

            if (response?.success) {
                console.log("Employee created successfully");
                canRedirect = true;
            }
        } catch (error: unknown) {
            console.error(`Error creating employee: ${error}`);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to complete onboarding"
            );
        } finally {
            setIsSubmitting(false);
        }

        if (canRedirect) {
            console.log("Redirecting to employee");
            toast.success("Onboarding completed successfully.");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleAdminSubmit = async (data: AdminFormValues) => {
        if (!user) {
            return;
        }

        let canRedirect = false;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await createAdmin(
                data.companyName,
                data.companyWebsite || "",
                data.companyLogo || "",
                user.id
            );

            if (response?.success) {
                console.log("Admin created successfully");
                canRedirect = true;
            }
        } catch (error) {
            console.error(`Error creating admin: ${error}`);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to complete onboarding. Please try again. "
            );
        } finally {
            setIsSubmitting(false);
        }

        if (canRedirect) {
            console.log("Redirecting to admin");
            toast.success("Onboarding completed successfully.");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    Complete your account setup
                </CardTitle>
                <CardDescription>
                    Weclome to TimeOffer! Let&apos;s get you onboarded.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Account Type</Label>
                        <RadioGroup
                            defaultValue="employee"
                            value={accountType}
                            onValueChange={(value) =>
                                setAccountType(value as "admin" | "employee")
                            }
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem
                                    value="employee"
                                    id="employee"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="employee"
                                    className={cn(
                                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                        accountType === "employee" &&
                                            "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <span>Employee</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem
                                    value="admin"
                                    id="admin"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="admin"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground"
                                >
                                    <span>Business Admin</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Separator />

                    {accountType === "employee" ? (
                        <Form {...employeeForm}>
                            <form
                                onSubmit={employeeForm.handleSubmit(
                                    handleEmployeeSubmit
                                )}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={employeeForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    First Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={employeeForm.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={employeeForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled
                                                    className="bg-gray-100"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={employeeForm.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Department (optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="e.g. Engineering, sales, etc."
                                                    className="bg-gray-100"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={employeeForm.control}
                                    name="invitationCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Invitation Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter the 6-digit code"
                                                    className="bg-gray-100"
                                                    maxLength={6}
                                                    pattern="[0-9]{6}"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the 6-digit invitation
                                                code provided by your company
                                                admin.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {error && (
                                    <Alert variant={"destructive"}>
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Processing"
                                        : "Complete setup"}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <Form {...adminForm}>
                            <form
                                onSubmit={adminForm.handleSubmit(
                                    handleAdminSubmit
                                )}
                                className="space-y-4"
                            >
                                <div>
                                    <h3 className="text-md font-medium mb-2">
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={adminForm.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        First Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled
                                                            className="bg-gray-100"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={employeeForm.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Last Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled
                                                            className="bg-gray-100"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={employeeForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Separator />

                                <div>
                                    <h3 className="text-md font-medium mb-2">
                                        Company Information
                                    </h3>
                                    <FormField
                                        control={adminForm.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Company Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Company Name"
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={adminForm.control}
                                        name="companyWebsite"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Company Website (optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Company Website"
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={adminForm.control}
                                        name="companyLogo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Company Logo (optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Company Logo URL"
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {error && (
                                    <Alert variant={"destructive"}>
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Processing"
                                        : "Complete setup"}
                                </Button>
                            </form>
                        </Form>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default OnboardingForm;
