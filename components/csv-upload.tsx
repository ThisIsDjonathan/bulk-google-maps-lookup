"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, X, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface CSVUploadProps {
  onUpload: (locations: string[]) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function CSVUpload({
  onUpload,
  onClear,
  disabled = false,
}: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);

      Papa.parse(file, {
        complete: (results) => {
          // Extract locations from CSV
          const locations: string[] = [];

          results.data.forEach((row: any) => {
            // Check if row is an array (as expected) and has at least one value
            if (Array.isArray(row) && row.length > 0) {
              const firstValue = row[0];
              // Only add non-empty strings
              if (typeof firstValue === "string" && firstValue.trim()) {
                locations.push(firstValue.trim());
              }
            } else if (typeof row === "string" && row.trim()) {
              // Handle case where row might be a string directly
              locations.push(row.trim());
            }
          });

          // Filter out empty rows and header rows that might contain column names
          const filteredLocations = locations.filter(
            (loc) =>
              loc !== "" &&
              !["address", "location", "place", "name", "query"].includes(
                loc.toLowerCase(),
              ),
          );

          setLocationCount(filteredLocations.length);

          if (filteredLocations.length === 0) {
            toast({
              title: "No locations found",
              description: "The CSV file doesn't contain any valid locations.",
              variant: "destructive",
            });
            return;
          }

          onUpload(filteredLocations);

          toast({
            title: "CSV file uploaded",
            description: `Found ${filteredLocations.length} locations in the file.`,
          });
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Error parsing CSV",
            description:
              "There was an error reading the CSV file. Please check the file format.",
            variant: "destructive",
          });
        },
      });
    },
    [onUpload, toast],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [disabled, handleFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    },
    [disabled, handleFile],
  );

  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleClear = useCallback(() => {
    setFileName(null);
    setFileSize(null);
    setLocationCount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  }, [onClear]);

  // Format file size in KB or MB
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!fileName ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled ? undefined : handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <FileUp className="h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium">Upload CSV File</h3>
            <p className="text-sm text-gray-500">
              Drag and drop a CSV file here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              The CSV should contain one location per row
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <FileText className="h-8 w-8 text-blue-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">{fileName}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Size: {fileSize ? formatFileSize(fileSize) : "Unknown"}</p>
                  <p>Locations: {locationCount}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <p>
          CSV file should have one location per row. Headers will be ignored.
        </p>
      </div>
    </div>
  );
}
