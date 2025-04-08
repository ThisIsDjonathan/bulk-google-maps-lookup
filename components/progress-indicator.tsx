"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { BatchProcessingStatus } from "@/types/lookup-types";

interface ProgressIndicatorProps {
  status: BatchProcessingStatus;
}

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (!status.isProcessing) return null;

  const progressPercentage = Math.round(
    (status.processedItems / status.totalItems) * 100,
  );

  // Format estimated time remaining
  const formatTimeRemaining = () => {
    if (!status.estimatedTimeRemaining) return "Calculating...";

    const seconds = Math.round(status.estimatedTimeRemaining / 1000);
    if (seconds < 60) return `${seconds} seconds`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-2 my-4 animate-in fade-in-50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            Batch {status.currentBatch} of {status.totalBatches}
          </Badge>
          <span className="text-slate-600">
            {status.processedItems} of {status.totalItems} locations processed
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTimeRemaining()}</span>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
