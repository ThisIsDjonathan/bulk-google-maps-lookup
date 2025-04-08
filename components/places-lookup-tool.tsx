"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InputSection } from "@/components/input-section";
import { OutputSection } from "@/components/output-section";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { LookupResult } from "@/types/lookup-types";

type LatLngLiteral = { lat: number; lng: number };

export function PlacesLookupTool() {
  const [results, setResults] = useState<LookupResult[]>([]);
  const [markers, setMarkers] = useState<LatLngLiteral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResults = (
    newResults: LookupResult[],
    newMarkers: LatLngLiteral[],
  ) => {
    setResults(newResults);
    setMarkers(newMarkers);

    const totalLocations = newResults.length;
    const successfulLookups = newResults.filter(
      (r) => r.results.length > 0,
    ).length;

    toast({
      title: "Lookup Complete",
      description: `Found results for ${successfulLookups} of ${totalLocations} locations.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Geocoding Error</AlertTitle>
          <AlertDescription>
            There was a problem during geocoding. Please try again.
            <div className="mt-2 text-sm">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-8">
        <Card className="shadow-md border-t-4 border-t-blue-500">
          <CardContent className="p-6">
            <InputSection
              onResults={handleResults}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              setError={setError}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-4 border-t-purple-500">
          <CardContent className="p-6">
            <OutputSection results={results} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
