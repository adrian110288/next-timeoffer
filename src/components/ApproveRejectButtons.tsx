"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateTimeOffRequestStatus } from "@/lib/actions/admin-actions";
import { toast } from "sonner";

const ApproveRejectButtons = ({ id }: { id: string }) => {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [notes, setNotes] = useState<string>("");
    const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
    const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">(
        "APPROVED"
    );

    const handleAction = async (status: "APPROVED" | "REJECTED") => {
        setActionType(status);
        setShowNotesModal(true);
    };

    const confirmAction = async () => {
        // server action stuff
        setIsLoading(true);

        try {
            await updateTimeOffRequestStatus({
                requestId: id,
                status: actionType,
                notes: notes,
            });

            setShowNotesModal(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    onClick={() => handleAction("APPROVED")}
                    variant={"default"}
                >
                    Approve
                </Button>
                <Button
                    onClick={() => handleAction("REJECTED")}
                    variant={"destructive"}
                >
                    Reject
                </Button>
            </div>
            <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "APPROVED"
                                ? "Approve request"
                                : "Reject request"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "APPROVED"
                                ? "Add any notes for the employee regarding this approved request"
                                : "Please provide a reason for rejecting this time off request"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter notes here... (optional)"
                                className="min-h-[100px]"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant={"outline"}
                                onClick={() => setShowNotesModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmAction}
                                disabled={isLoading}
                                variant={
                                    actionType === "APPROVED"
                                        ? "default"
                                        : "destructive"
                                }
                            >
                                {isLoading
                                    ? "Processing..."
                                    : actionType === "APPROVED"
                                    ? "Approve"
                                    : "Reject"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ApproveRejectButtons;
