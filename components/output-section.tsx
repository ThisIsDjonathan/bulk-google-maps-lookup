"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCopy, Check, FileJson, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsTable } from "@/components/results-table";
import type { LookupResult } from "@/types/lookup-types";
import { formatResultsAsCSV } from "@/lib/format-utils";
import { useToast } from "@/hooks/use-toast";

interface OutputSectionProps {
  results: LookupResult[];
  isLoading: boolean;
}

export function OutputSection({ results, isLoading }: OutputSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("csv");
  const { toast } = useToast();

  const csvOutput = formatResultsAsCSV(results);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Simple function to download text as a file
  const downloadTextFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    try {
      // Create a blob with the data
      const blob = new Blob([content], { type: mimeType });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Append to the document
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `${filename} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      });
    }
  };

  // Export as CSV
  const exportCSV = () => {
    if (isLoading || results.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(csvOutput, `places-lookup-${timestamp}.csv`, "text/csv");
  };

  // Export as JSON
  const exportJSON = () => {
    if (isLoading || results.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonContent = JSON.stringify(results, null, 2);
    downloadTextFile(
      jsonContent,
      `places-lookup-${timestamp}.json`,
      "application/json",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-700">Output</h2>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={isLoading || results.length === 0}
            className="border-purple-300 hover:bg-purple-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportJSON}
            disabled={isLoading || results.length === 0}
            className="border-purple-300 hover:bg-purple-50"
          >
            <FileJson className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <p className="text-slate-600 mb-4">
        View your results in CSV format or as a sortable table
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Format</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="mt-4">
          <div className="space-y-4">
            <Textarea
              readOnly
              placeholder='"Input","Status","Name","Latitude","Longitude","Address","Place ID","Google Maps URL","Error","Suggestions"
"Eiffel Tower","Success","Avenue Gustave Eiffel",48.85837009999999,2.2944813,"Av. Gustave Eiffel, 75007 Paris, France",ChIJLU7jZClu5kcR4PcOOO6p3I0,"https://www.google.com/maps/place/?q=place_id:ChIJLU7jZClu5kcR4PcOOO6p3I0","",""'
              className="min-h-[200px] font-mono text-sm"
              value={isLoading ? "Looking up places..." : csvOutput}
            />

            <Button
              onClick={copyToClipboard}
              disabled={isLoading || results.length === 0}
              variant="outline"
              className="w-full border-purple-300 hover:bg-purple-50"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          {isLoading ? (
            <div className="min-h-[200px] flex items-center justify-center text-slate-500">
              Looking up places...
            </div>
          ) : (
            <ResultsTable results={results} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
