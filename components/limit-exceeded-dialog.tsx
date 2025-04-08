"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";

interface LimitExceededDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locationCount: number;
}

export function LimitExceededDialog({
  isOpen,
  onClose,
  locationCount,
}: LimitExceededDialogProps) {
  const [emailSent, setEmailSent] = useState(false);

  const handleSendEmail = () => {
    // Open email client with pre-filled email
    const subject = encodeURIComponent("Request for increased location limit");
    const body = encodeURIComponent(
      `Hello,\n\nI would like to request an increase to my location lookup limit. I need to process ${locationCount} locations.\n\nThank you.`,
    );
    window.open(`mailto:email@djonathan.com?subject=${subject}&body=${body}`);
    setEmailSent(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Location Limit Exceeded</DialogTitle>
          <DialogDescription>
            You've exceeded the maximum limit of 50 locations. Please contact us
            to request a higher limit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            You're trying to process{" "}
            <span className="font-semibold text-blue-600">{locationCount}</span>{" "}
            locations, but the current limit is{" "}
            <span className="font-semibold">50</span>.
          </p>
          <p className="text-sm text-slate-600">
            Send us an email explaining your needs, and we'll consider
            increasing your limit.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            className="sm:w-auto w-full gap-2"
            variant={emailSent ? "outline" : "default"}
          >
            <Mail className="h-4 w-4" />
            {emailSent ? "Email Sent" : "Send Email Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
