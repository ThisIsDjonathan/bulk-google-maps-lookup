"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  Info,
  FileText,
  Edit,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BatchConfigSimple } from "@/components/batch-config-simple";
import { CSVUpload } from "@/components/csv-upload";
import { ProgressIndicator } from "@/components/progress-indicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LimitExceededDialog } from "@/components/limit-exceeded-dialog";
import type {
  LookupResult,
  BatchProcessingStatus,
  BatchConfig,
} from "@/types/lookup-types";
import { performLookup } from "@/lib/places-service";
import { useToast } from "@/hooks/use-toast";
import { RateLimitIndicator } from "@/components/rate-limit-indicator";
import { RateLimitExceededDialog } from "@/components/rate-limit-exceeded-dialog";

const LOCATION_LIMIT = process.env.NEXT_PUBLIC_DAILY_LIMIT
  ? parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT, 10)
  : 50;

interface InputSectionProps {
  onResults: (results: LookupResult[], markers: LatLngLiteral[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isLoading: boolean;
}

type LatLngLiteral = { lat: number; lng: number };

export function InputSection({
  onResults,
  setIsLoading,
  isLoading,
  setError,
}: InputSectionProps) {
  const [inputTab, setInputTab] = useState<string>("manual");
  const [input, setInput] = useState("");
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    batchSize: 10,
    delayBetweenBatches: 500,
  });
  const [processingStatus, setProcessingStatus] =
    useState<BatchProcessingStatus>({
      totalItems: 0,
      processedItems: 0,
      currentBatch: 0,
      totalBatches: 0,
      isProcessing: false,
    });
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimitResetAt, setRateLimitResetAt] = useState<Date>(new Date());
  const [rateLimitKey, setRateLimitKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      setProcessingStatus((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [isLoading]);

  const locationCount = input.trim()
    ? input.split(/\s*\n\s*/).filter((line) => line.trim().length > 0).length
    : 0;
  const isOverLimit = locationCount > LOCATION_LIMIT;

  const handleRateLimitExceeded = (resetAt: Date) => {
    setRateLimitResetAt(resetAt);
    setShowRateLimitDialog(true);
  };

  const refreshRateLimitIndicator = useCallback(() => {
    setRateLimitKey((prev) => prev + 1);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    if (isOverLimit) {
      setShowLimitDialog(true);
      return;
    }

    try {
      const rateLimitResponse = await fetch(`/api/rate-limit?t=${Date.now()}`);
      const rateLimitData = await rateLimitResponse.json();

      if (rateLimitData.isLimited) {
        handleRateLimitExceeded(new Date(rateLimitData.resetAt));
        return;
      }
    } catch (error) {
      console.error("Error checking rate limit:", error);
    }

    setIsLoading(true);
    setError(null);

    try {
      const { results, markers } = await performLookup(
        input,
        batchConfig,
        (status) => setProcessingStatus(status),
        true,
      );

      const rateLimitError = results.find(
        (r) => r.error?.code === "RATE_LIMIT_EXCEEDED",
      );
      if (rateLimitError) {
        const rateLimitResponse = await fetch(
          `/api/rate-limit?t=${Date.now()}`,
        );
        const rateLimitData = await rateLimitResponse.json();
        handleRateLimitExceeded(new Date(rateLimitData.resetAt));
      } else {
        onResults(results, markers);
      }

      refreshRateLimitIndicator();
    } catch (error: any) {
      console.error("Error performing lookup:", error);
      toast({
        title: "Lookup error",
        description:
          "An error occurred while performing the lookup. Please try again.",
        variant: "destructive",
      });
      setError(error.message || "Unexpected error during lookup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchConfigChange = (newConfig: BatchConfig) => {
    setBatchConfig(newConfig);
  };

  const handleCSVUpload = (locations: string[]) => {
    const limitedLocations =
      locations.length > LOCATION_LIMIT
        ? locations.slice(0, LOCATION_LIMIT)
        : locations;
    const newInput = limitedLocations.join("\n");
    setInput(newInput);
    setInputTab("manual");

    if (locations.length > LOCATION_LIMIT) {
      toast({
        title: "Location limit",
        description: `Only the first ${LOCATION_LIMIT} locations have been loaded. Contact us to request a higher limit.`,
        variant: "destructive",
      });
    }
  };

  const handleClearCSV = () => {
    setInput("");
  };

  const isSubmitDisabled = isLoading || !input.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-700">Input</h2>
        <div className="flex items-center gap-2">
          <BatchConfigSimple
            config={batchConfig}
            onConfigChange={handleBatchConfigChange}
          />
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">How to Use</AlertTitle>
        <AlertDescription className="text-blue-700">
          Enter location names or addresses, one per line. The search will
          automatically find the best match for each entry and return the place
          details. <br />
          <br />
          The results will include:
          <ul className="list-disc list-inside">
            <li>
              <strong>Google Place ID</strong>
            </li>
            <li>
              <strong>Google Maps URL</strong>
            </li>
            <li>Location Name</li>
            <li>Latitude and Longitude</li>
            <li>Address</li>
          </ul>
          <br />
        </AlertDescription>
      </Alert>

      <Alert className="bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Location Limit</AlertTitle>
        <AlertDescription className="text-yellow-700">
          You can process up to {LOCATION_LIMIT} locations at once. Need more?
          Contact us for a higher limit:{" "}
          <a
            href="mailto:email@djonathan.com"
            className="text-yellow-800 font-medium underline hover:text-yellow-900"
          >
            email@djonathan.com
          </a>
        </AlertDescription>
      </Alert>

      <div key={rateLimitKey}>
        <RateLimitIndicator />
      </div>

      <Tabs value={inputTab} onValueChange={setInputTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" disabled={isLoading}>
            <Edit className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="csv" disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <p className="text-slate-600">
            Enter location names or addresses, one per line.
          </p>

          <Textarea
            placeholder={`Examples:
Eiffel Tower
1600 Amphitheatre Parkway, Mountain View, CA
Statue of Liberty
Golden Gate Bridge`}
            className={`min-h-[200px] font-mono text-sm ${
              isOverLimit ? "border-red-300 focus-visible:ring-red-300" : ""
            }`}
            style={{ whiteSpace: "pre-wrap" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {isOverLimit && (
            <p className="text-red-500 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              You've exceeded the {LOCATION_LIMIT} location limit. Contact us to
              request a higher limit.
            </p>
          )}
        </TabsContent>

        <TabsContent value="csv" className="mt-4 space-y-4">
          <p className="text-slate-600">
            Upload a CSV file with one location per row.{" "}
            <strong>Example CSV:</strong>
            <br />
            <i>Eiffel Tower</i>
            <br />
            <i>1600 Amphitheatre Parkway, Mountain View, CA</i>
            <br />
            <i>Statue of Liberty</i>
            <br />
            <i>Golden Gate Bridge</i>
            <br />
          </p>

          <CSVUpload
            onUpload={handleCSVUpload}
            onClear={handleClearCSV}
            disabled={isLoading}
          />
        </TabsContent>
      </Tabs>

      {locationCount > 0 && (
        <div className="text-sm text-slate-600">
          {locationCount} location{locationCount !== 1 ? "s" : ""} to process
          {locationCount > 20 && (
            <span className="ml-1 text-amber-600">
              (large batch - consider adjusting batch settings)
            </span>
          )}
        </div>
      )}

      <ProgressIndicator status={processingStatus} />

      <Button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing... ({processingStatus.processedItems}/
            {processingStatus.totalItems})
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Look Up Locations
          </>
        )}
      </Button>

      <LimitExceededDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        locationCount={locationCount}
      />

      <RateLimitExceededDialog
        isOpen={showRateLimitDialog}
        onClose={() => setShowRateLimitDialog(false)}
        resetAt={rateLimitResetAt}
      />
    </div>
  );
}
