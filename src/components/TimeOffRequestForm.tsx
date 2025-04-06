"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    format,
    isSameDay,
    isWithinInterval,
    addDays,
    isWeekend,
} from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeOffRequest, TimeOffType, CompanyHoliday } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, InfoIcon, XIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "./ui/checkbox";
import { createTimeOffRequest } from "@/lib/actions/employee-actions";

const getDaysBetween = (startDate: Date, endDate: Date) => {
    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
    }

    return days;
};

const requestSchema = z
    .object({
        startDate: z.date({
            required_error: "Start date is required",
        }),
        endDate: z
            .date({
                required_error: "End date is required",
            })
            .refine(
                (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
                {
                    message: "End date must be today or in the future",
                }
            ),
        type: z.enum(["VACATION", "SICK", "PERSONAL", "OTHER"]),
        reason: z.string().optional(),
        excludeWeekends: z.boolean().optional(),
        excludeHolidays: z.boolean().optional(),
        customExcludedDates: z.array(z.date()).default([]),
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: "Start date must be before end date",
        path: ["endDate"],
    });

type FormValues = z.infer<typeof requestSchema>;

const hasDateOverlap = (
    startDate: Date,
    endDate: Date,
    existingRequests: TimeOffRequest[]
): { overlaps: boolean; conflictingRequest?: TimeOffRequest } => {
    for (const request of existingRequests) {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);

        const startOverlap =
            isWithinInterval(startDate, {
                start: requestStart,
                end: requestEnd,
            }) ||
            isSameDay(startDate, requestStart) ||
            isSameDay(startDate, requestEnd);

        const endOverlap =
            isWithinInterval(endDate, {
                start: requestStart,
                end: requestEnd,
            }) ||
            isSameDay(endDate, requestStart) ||
            isSameDay(endDate, requestEnd);

        const encompassesExisting =
            startDate <= requestStart && endDate >= requestEnd;

        if (startOverlap || endOverlap || encompassesExisting) {
            return { overlaps: true, conflictingRequest: request };
        }
    }

    return { overlaps: false };
};

const getRequestTypeColor = (type: TimeOffType) => {
    switch (type) {
        case "VACATION":
            return "bg-blue-100 text-blue-800";
        case "SICK":
            return "bg-red-100 text-red-800";
        case "PERSONAL":
            return "bg-purple-100 text-purple-800";
        case "OTHER":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const bankHolidays = [
    new Date(new Date().getFullYear(), 0, 1), // New Year's Day
    new Date(new Date().getFullYear(), 11, 25), // Christmas Day
    new Date(new Date().getFullYear(), 11, 26), // Boxing Day
];

const calculateWorkingDays = (
    startDate: Date,
    endDate: Date,
    excludeWeekends: boolean,
    excludeHolidays: boolean,
    customExcludedDates: Date[],
    companyHolidays: CompanyHoliday[]
): {
    totalDays: number;
    workingDays: number;
    excludedDays: Date[];
} => {
    const daysBetween = getDaysBetween(startDate, endDate);
    const totalDays = daysBetween.length;

    const excludedDays: Date[] = [];

    daysBetween.forEach((day) => {
        if (excludeWeekends && isWeekend(day)) {
            excludedDays.push(day);
            return;
        }

        if (
            excludeHolidays &&
            bankHolidays.some((holiday) => isSameDay(holiday, day))
        ) {
            excludedDays.push(day);
            return;
        }

        if (
            excludeHolidays &&
            companyHolidays.some((holiday) => isSameDay(holiday.date, day))
        ) {
            excludedDays.push(day);
            return;
        }

        if (customExcludedDates.some((excluded) => isSameDay(excluded, day))) {
            excludedDays.push(day);
            return;
        }
    });

    const workingDays = totalDays - excludedDays.length;

    return { totalDays, workingDays, excludedDays };
};

const TimeOffRequestForm = ({
    existingRequests,
    companyHolidays,
}: {
    existingRequests: TimeOffRequest[];
    companyHolidays: CompanyHoliday[];
}) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [dateOverlapError, setDateOverlapError] = useState<string | null>(
        null
    );
    const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            type: "VACATION",
            excludeWeekends: true,
            excludeHolidays: true,
            customExcludedDates: [],
        },
    });

    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    const excludeWeekends = form.watch("excludeWeekends");
    const excludeHolidays = form.watch("excludeHolidays");
    const customExcludedDates = form.watch("customExcludedDates");

    const { totalDays, workingDays, excludedDays } =
        startDate && endDate
            ? calculateWorkingDays(
                  startDate,
                  endDate,
                  excludeWeekends ?? false,
                  excludeHolidays ?? false,
                  customExcludedDates,
                  companyHolidays
              )
            : {
                  totalDays: 0,
                  workingDays: 0,
                  excludedDays: [],
              };

    useEffect(() => {
        if (startDate && endDate && startDate <= endDate) {
            const { overlaps, conflictingRequest } = hasDateOverlap(
                startDate,
                endDate,
                existingRequests
            );

            if (overlaps && conflictingRequest) {
                const formattedStart = format(
                    new Date(conflictingRequest.startDate),
                    "MMM d, yyyy"
                );
                const formattedEnd = format(
                    new Date(conflictingRequest.endDate),
                    "MMM d, yyyy"
                );
                setDateOverlapError(
                    `This request overlaps with your existing ${conflictingRequest.type} time off request from ${formattedStart} to ${formattedEnd}.`
                );
            } else {
                setDateOverlapError(null);
            }
        }
    }, [startDate, endDate, existingRequests]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append("startDate", data.startDate.toISOString());
        formData.append("endDate", data.endDate.toISOString());
        formData.append("type", data.type);
        if (data.reason) formData.append("reason", data.reason || "");
        formData.append(
            "excludeWeekends",
            data.excludeWeekends ? "true" : "false"
        );
        formData.append(
            "excludeHolidays",
            data.excludeHolidays ? "true" : "false"
        );
        formData.append("workingDays", workingDays.toString());

        if (data.customExcludedDates.length > 0) {
            formData.append(
                "customExcludedDates",
                JSON.stringify(
                    data.customExcludedDates.map((date) => date.toISOString())
                )
            );
        }

        try {
            // cALL server action to create time off request
            const timeOffRequestData = await createTimeOffRequest(formData);
            if (timeOffRequestData) {
                toast.success("Time off request created successfully");
                router.push("/employee/my-requests");
            }
        } catch (error) {
            console.error("Error creating time off request:", error);
            setError("An error occurred while creating the request");
            toast.error("An error occurred while creating the request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 mt-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">New time off request</h1>
                <p className="text-gray-500">
                    Submit a new time off request to your manager
                </p>
            </div>
            {existingRequests?.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Your upcoming time off.
                        </h2>
                        <div className="space-y-2">
                            {existingRequests
                                .filter(
                                    (request) =>
                                        new Date(request.startDate) >=
                                        new Date()
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(a.startDate).getTime() -
                                        new Date(b.startDate).getTime()
                                )
                                .map((request) => {
                                    return (
                                        <div
                                            className="p-3 border rounded-md flex justify-between items-center"
                                            key={request.id}
                                        >
                                            <Badge
                                                className={getRequestTypeColor(
                                                    request.type
                                                )}
                                            >
                                                {request.type.charAt(0) +
                                                    request.type
                                                        .slice(1)
                                                        .toLowerCase()}
                                            </Badge>
                                            <div className="mt-1">
                                                {format(
                                                    new Date(request.startDate),
                                                    "MMM d, yyyy"
                                                )}{" "}
                                                -{" "}
                                                {format(
                                                    new Date(request.endDate),
                                                    "MMM d, yyyy"
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {request.reason && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {request.reason}
                                                    </div>
                                                )}
                                                <Badge
                                                    variant={
                                                        request.status ===
                                                        "PENDING"
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
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardContent className="py-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    onChange={(e) => {
                                                        const date =
                                                            e.target
                                                                .valueAsDate;
                                                        if (date) {
                                                            field.onChange(
                                                                date
                                                            );
                                                        }
                                                    }}
                                                    value={
                                                        field.value
                                                            ? format(
                                                                  field.value,
                                                                  "yyyy-MM-dd"
                                                              )
                                                            : ""
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    onChange={(e) => {
                                                        const date =
                                                            e.target
                                                                .valueAsDate;
                                                        if (date) {
                                                            field.onChange(
                                                                date
                                                            );
                                                        }
                                                    }}
                                                    value={
                                                        field.value
                                                            ? format(
                                                                  field.value,
                                                                  "yyyy-MM-dd"
                                                              )
                                                            : ""
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {startDate && endDate && startDate > endDate && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        The end date cannot be before the start
                                        date
                                    </AlertDescription>
                                </Alert>
                            )}
                            {dateOverlapError && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {dateOverlapError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {startDate &&
                                endDate &&
                                !form.formState.errors.startDate &&
                                !form.formState.errors.endDate && (
                                    <div className="text-sm">
                                        {totalDays === 0 ? (
                                            <Alert variant={"default"}>
                                                <AlertDescription>
                                                    Same day request
                                                </AlertDescription>
                                            </Alert>
                                        ) : totalDays === 1 ? (
                                            <span>1 day</span>
                                        ) : (
                                            <span>{totalDays} days</span>
                                        )}
                                    </div>
                                )}

                            <div className="bg-gray-50 p-4 rounded-md space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">
                                        Day exclusion options
                                    </h3>
                                    <div className="relative">
                                        <InfoIcon className="h-4 w-4 text-gray-500 cursor-help" />
                                        <div className="absolute hidden group-hover:block w-64 p-2 bg-black text-white text-xs rounded shadow-lg -top-2 -right-2">
                                            Excluded days will show in your time
                                            off date range but will not be
                                            deducted from your time off
                                            allowance.
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="excludeWeekends"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Exclude weekends
                                                </FormLabel>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Exclude weekends
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Saturdays and days
                                                        won&apos;t be deducted
                                                        from your leave
                                                        allowance.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="excludeHolidays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Exclude holidays
                                                </FormLabel>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Exclude holidays
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Holiday Days won&apos;t
                                                        be deducted from your
                                                        leave allowance.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="customExcludedDates"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Custom excluded dates (optional)
                                            </FormLabel>
                                            <FormDescription>
                                                Add specific dates that should
                                                be excluded from your time off
                                                allowance. (e.g dentist
                                                appointments or sick leave)
                                            </FormDescription>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {field.value.map(
                                                    (date, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="gap-1"
                                                        >
                                                            {format(
                                                                date,
                                                                "MMM d, yyyy"
                                                            )}
                                                            <Button
                                                                variant={
                                                                    "ghost"
                                                                }
                                                                size="sm"
                                                                className="h-4 w-4 p-0"
                                                                onClick={() => {
                                                                    const newDates =
                                                                        [
                                                                            ...field.value,
                                                                        ];
                                                                    newDates.splice(
                                                                        index,
                                                                        1
                                                                    );
                                                                    field.onChange(
                                                                        newDates
                                                                    );
                                                                }}
                                                            >
                                                                <XIcon className="h-4 w-4" />
                                                            </Button>
                                                        </Badge>
                                                    )
                                                )}

                                                <Popover
                                                    open={calendarOpen}
                                                    onOpenChange={
                                                        setCalendarOpen
                                                    }
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className="h-8"
                                                            size="sm"
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            Add date
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={undefined}
                                                            onSelect={(
                                                                date
                                                            ) => {
                                                                if (date) {
                                                                    const exists =
                                                                        field.value.some(
                                                                            (
                                                                                d
                                                                            ) =>
                                                                                isSameDay(
                                                                                    d,
                                                                                    date
                                                                                )
                                                                        );
                                                                    if (
                                                                        !exists
                                                                    ) {
                                                                        field.onChange(
                                                                            [
                                                                                ...field.value,
                                                                                date,
                                                                            ]
                                                                        );
                                                                    }
                                                                }
                                                                setCalendarOpen(
                                                                    false
                                                                );
                                                            }}
                                                            disabled={(date) =>
                                                                // Disable dates outside the selected range
                                                                startDate &&
                                                                endDate
                                                                    ? date <
                                                                          startDate ||
                                                                      date >
                                                                          endDate
                                                                    : false
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {startDate &&
                                endDate &&
                                !form.formState.errors.startDate &&
                                !form.formState.errors.endDate && (
                                    <div className="bg-blue-50 p-4 rounded-md space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                Duration Summary
                                            </span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="font-medium">
                                                    Total days:
                                                </div>
                                                <div>
                                                    {totalDays} calendar day
                                                    {totalDays !== 1 ? "s" : ""}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-blue-700">
                                                        Working days (counted):
                                                    </div>
                                                    <div className="text-blue-700 font-bold">
                                                        {workingDays} day
                                                        {workingDays !== 1
                                                            ? "s"
                                                            : ""}
                                                    </div>
                                                </div>
                                                {excludedDays?.length > 0 && (
                                                    <div className="col-span-2">
                                                        <div className="font-medium">
                                                            Excluded days:
                                                        </div>
                                                        <div className="text-gray-600">
                                                            {
                                                                excludedDays.length
                                                            }{" "}
                                                            day
                                                            {excludedDays.length !==
                                                            1
                                                                ? "s"
                                                                : ""}
                                                            {excludedDays?.length >
                                                                0 && (
                                                                <div className="mt-1 text-xs">
                                                                    {excludedDays?.map(
                                                                        (
                                                                            day,
                                                                            i
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="inline-block mr-2 mb-1 px-2 py-1 bg-gray-100 rounded"
                                                                            >
                                                                                {format(
                                                                                    day,
                                                                                    "EEE, MMM d"
                                                                                )}
                                                                                {isWeekend(
                                                                                    day
                                                                                )
                                                                                    ? " (weekend)"
                                                                                    : bankHolidays?.some(
                                                                                          (
                                                                                              h
                                                                                          ) =>
                                                                                              isSameDay(
                                                                                                  h,
                                                                                                  day
                                                                                              )
                                                                                      )
                                                                                    ? " (holiday )"
                                                                                    : ""}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time off type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a type of time off" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="VACATION">
                                                    Vacation
                                                </SelectItem>
                                                <SelectItem value="SICK">
                                                    Sick leave
                                                </SelectItem>
                                                <SelectItem value="PERSONAL">
                                                    Personal Time
                                                </SelectItem>
                                                <SelectItem value="OTHER">
                                                    Other
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter a reason for your time off request"
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && (
                                <Alert variant={"destructive"}>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting || !!dateOverlapError
                                    }
                                >
                                    {isSubmitting
                                        ? "Submitting"
                                        : "Submit request"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default TimeOffRequestForm;
