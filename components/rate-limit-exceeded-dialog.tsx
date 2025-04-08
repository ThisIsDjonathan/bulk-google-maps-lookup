"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Clock } from "lucide-react";

interface RateLimitExceededDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resetAt: Date;
}

export function RateLimitExceededDialog({
  isOpen,
  onClose,
  resetAt,
}: RateLimitExceededDialogProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Update time left until reset
  useEffect(() => {
    if (!isOpen) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const diffMs = resetAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        onClose();
        return;
      }

      // Format the time remaining in a more human-readable way for a day
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        setTimeLeft(`${diffHours} hours and ${diffMins} minutes`);
      } else {
        setTimeLeft(`${diffMins} minutes`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute for daily limit
    return () => clearInterval(interval);
  }, [isOpen, resetAt, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Daily Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've reached the maximum number of requests allowed for today.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            To prevent abuse and ensure fair usage for all users, we limit each
            user to 50 requests per day.
          </p>

          <p className="text-sm text-slate-600 mb-4">
            If you need more requests, please contact{" "}
            <a
              href="mailto:email@djonathan.com"
              className="text-blue-600 font-medium underline hover:text-blue-800"
            >
              email@djonathan.com
            </a>{" "}
            by email.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
              <Clock className="h-4 w-4" />
              <span>Your limit will reset in:</span>
            </div>
            <div className="text-2xl font-bold text-center text-amber-900">
              {timeLeft}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
