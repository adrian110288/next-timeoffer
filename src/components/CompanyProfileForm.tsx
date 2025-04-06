"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "./ui/alert";
import { updateCompanyProfile } from "@/lib/actions/admin-actions";
import { toast } from "sonner";

const companyProfileSchema = z.object({
    name: z.string().min(1, "Company name is required").max(100),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    logo: z.string().optional().or(z.literal("")),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
    initialData: {
        name: string;
        website: string;
        logo: string;
    };
}

export default function CompanyProfileForm({
    initialData,
}: CompanyProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<CompanyProfileFormValues>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: {
            name: initialData.name,
            website: initialData.website,
            logo: initialData.logo,
        },
    });

    const onSubmit = async (data: CompanyProfileFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // call server action to update company profile
            const request = await updateCompanyProfile({
                name: data.name,
                website: data.website,
                logo: data.logo,
            });

            if (request.success) {
                toast.success("Company profile updated successfully");
            } else {
                toast.error("Failed to update company profile");
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update company profile."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {error && (
                <Alert variant={"destructive"}>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter company name"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter website link"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="logo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter logo link"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-gray-500">
                                                Enter a URL to your company
                                                logo.
                                            </p>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        </>
                                    ) : (
                                        "Save changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
