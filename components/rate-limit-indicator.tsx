"use client";

import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface RateLimitInfo {
  remaining: number;
  limit: number;
  used: number;
  resetAt: Date;
  isLimited: boolean;
}

export function RateLimitIndicator() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch rate limit info
  const fetchRateLimitInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Add cache-busting parameter to prevent caching
      const response = await fetch(`/api/rate-limit?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch rate limit info: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Rate limit data received:", data); // Debug log

      setRateLimitInfo({
        remaining: data.remaining,
        limit: data.limit,
        used: data.used || data.limit - data.remaining,
        resetAt: new Date(data.resetAt),
        isLimited: data.isLimited,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch rate limit info:", error);
      setError("Failed to load usage information. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update time left until reset
  useEffect(() => {
    if (!rateLimitInfo) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const resetAt = new Date(rateLimitInfo.resetAt);
      const diffMs = resetAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        fetchRateLimitInfo();
        return;
      }

      // Format the time remaining in a more human-readable way for a day
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        setTimeLeft(`${diffHours}h ${diffMins}m`);
      } else {
        setTimeLeft(`${diffMins}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute for daily limit
    return () => clearInterval(interval);
  }, [rateLimitInfo, fetchRateLimitInfo]);

  // Fetch rate limit info on mount and periodically
  useEffect(() => {
    fetchRateLimitInfo();

    // Refresh every 5 minutes
    const interval = setInterval(fetchRateLimitInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRateLimitInfo]);

  // Format the last updated time
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-center justify-between">
        <span>{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRateLimitInfo}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (loading && !rateLimitInfo) {
    return (
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm flex items-center">
        <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
        Loading usage information...
      </div>
    );
  }

  if (!rateLimitInfo) return null;

  const usagePercentage = (rateLimitInfo.used / rateLimitInfo.limit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Badge
                    variant={
                      rateLimitInfo.isLimited ? "destructive" : "outline"
                    }
                    className={`${
                      rateLimitInfo.isLimited
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {rateLimitInfo.remaining} / {rateLimitInfo.limit} requests
                    remaining today
                  </Badge>
                  {rateLimitInfo.isLimited && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You can make up to {rateLimitInfo.limit} requests per day</p>
                <p>Used: {rateLimitInfo.used} requests</p>
                <p>Last updated: {formatLastUpdated()}</p>
                {rateLimitInfo.isLimited && (
                  <p className="text-red-500">
                    Daily limit reached. Limit will reset tomorrow.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <Clock className="h-3.5 w-3.5" />
          <span>Resets in {timeLeft}</span>
        </div>
      </div>
      <Progress value={usagePercentage} className="h-2" />
    </div>
  );
}
