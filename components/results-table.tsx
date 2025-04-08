"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Map,
  Copy,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { LookupResult, PlaceResult } from "@/types/lookup-types";

interface ResultsTableProps {
  results: LookupResult[];
}

type SortField =
  | "query"
  | "name"
  | "lat"
  | "lng"
  | "address"
  | "place_id"
  | "status";
type SortDirection = "asc" | "desc";

interface FlattenedResult extends Partial<PlaceResult> {
  query: string;
  status: "success" | "error";
  errorMessage?: string;
  errorCode?: string;
  suggestions?: string[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("query");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filter, setFilter] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>(
    {},
  );
  const { toast } = useToast();

  // Flatten the nested results structure for easier display and sorting
  const flattenedResults = useMemo(() => {
    const flattened: FlattenedResult[] = [];

    results.forEach((lookupResult) => {
      if (lookupResult.error) {
        // Error case
        flattened.push({
          query: lookupResult.query,
          status: "error",
          errorMessage: lookupResult.error.message,
          errorCode: lookupResult.error.code,
          suggestions: lookupResult.error.suggestions,
          place_id: "",
          name: "",
          lat: 0,
          lng: 0,
          address: "",
        });
      } else if (lookupResult.results.length === 0) {
        // No results but no specific error
        flattened.push({
          query: lookupResult.query,
          status: "error",
          errorMessage: "No results found",
          place_id: "",
          name: "",
          lat: 0,
          lng: 0,
          address: "",
        });
      } else {
        // Success case - add each result with its query
        lookupResult.results.forEach((place) => {
          flattened.push({
            query: lookupResult.query,
            status: "success",
            ...place,
          });
        });
      }
    });

    return flattened;
  }, [results]);

  // Sort and filter the results
  const sortedAndFilteredResults = useMemo(() => {
    // First filter
    const filtered = filter
      ? flattenedResults.filter(
          (result) =>
            result.query.toLowerCase().includes(filter.toLowerCase()) ||
            (result.name &&
              result.name.toLowerCase().includes(filter.toLowerCase())) ||
            (result.address &&
              result.address.toLowerCase().includes(filter.toLowerCase())) ||
            (result.place_id &&
              result.place_id.toLowerCase().includes(filter.toLowerCase())) ||
            (result.errorMessage &&
              result.errorMessage.toLowerCase().includes(filter.toLowerCase())),
        )
      : flattenedResults;

    // Then sort
    return [...filtered].sort((a, b) => {
      // Special case for status field
      if (sortField === "status") {
        if (sortDirection === "asc") {
          return a.status === "error" && b.status !== "error"
            ? 1
            : a.status !== "error" && b.status === "error"
              ? -1
              : 0;
        } else {
          return a.status === "error" && b.status !== "error"
            ? -1
            : a.status !== "error" && b.status === "error"
              ? 1
              : 0;
        }
      }

      let aValue = a[sortField as keyof FlattenedResult] || "";
      let bValue = b[sortField as keyof FlattenedResult] || "";

      // Handle null values
      if (aValue === null) aValue = "";
      if (bValue === null) bValue = "";

      // Compare based on type
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        return sortDirection === "asc"
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      }
    });
  }, [flattenedResults, sortField, sortDirection, filter]);

  // Pagination logic
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredResults.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredResults, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(sortedAndFilteredResults.length / pageSize),
  );

  // Reset to first page when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filter, pageSize]);

  // Toggle sort direction or change sort field
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis1");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis2");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Toggle expanded state for error suggestions
  const toggleErrorExpanded = (index: number) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Generate Google Maps URL
  const getGoogleMapsUrl = (result: FlattenedResult) => {
    if (result.place_id) {
      // If we have a place_id, use that for a more precise link
      return `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
    } else if (result.lat && result.lng) {
      // Otherwise use coordinates
      return `https://www.google.com/maps?q=${result.lat},${result.lng}`;
    }
    return null;
  };

  // Copy place_id to clipboard
  const copyPlaceId = (placeId: string) => {
    navigator.clipboard.writeText(placeId);
    toast({
      title: "Copied to clipboard",
      description: "Place ID has been copied to clipboard",
    });
  };

  // Calculate success and error counts
  const successCount = flattenedResults.filter(
    (r) => r.status === "success",
  ).length;
  const errorCount = flattenedResults.filter(
    (r) => r.status === "error",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter results..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {successCount} found
            </span>
            <span className="flex items-center text-sm text-red-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errorCount} failed
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("query")}
                  className="h-8 font-semibold"
                >
                  Input
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-8 font-semibold"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-8 font-semibold"
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("place_id")}
                  className="h-8 font-semibold"
                >
                  Place ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("lat")}
                  className="h-8 font-semibold"
                >
                  Latitude
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("lng")}
                  className="h-8 font-semibold"
                >
                  Longitude
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("address")}
                  className="h-8 font-semibold"
                >
                  Address / Error Details
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <span className="font-semibold">Open In Maps</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResults.length > 0 ? (
              paginatedResults.map((result, index) => (
                <TableRow key={`${result.query}-${result.place_id || index}`}>
                  <TableCell className="font-medium">{result.query}</TableCell>
                  <TableCell>
                    {result.status === "success" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{result.name || "-"}</TableCell>
                  <TableCell>
                    {result.place_id ? (
                      <div className="flex items-center gap-1">
                        <span
                          className="font-mono text-xs truncate max-w-[120px]"
                          title={result.place_id}
                        >
                          {result.place_id}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyPlaceId(result.place_id || "")
                                }
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Copy Place ID</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Place ID</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {result.lat ? result.lat.toFixed(6) : "-"}
                  </TableCell>
                  <TableCell>
                    {result.lng ? result.lng.toFixed(6) : "-"}
                  </TableCell>
                  <TableCell>
                    {result.status === "success" ? (
                      <span
                        className="max-w-xs truncate"
                        title={result.address}
                      >
                        {result.address}
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-red-600 font-medium">
                          {result.errorMessage}
                        </div>
                        {result.suggestions &&
                          result.suggestions.length > 0 && (
                            <div>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-blue-600 flex items-center"
                                onClick={() => toggleErrorExpanded(index)}
                              >
                                {expandedErrors[index] ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide suggestions
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    View suggestions
                                  </>
                                )}
                              </Button>

                              {expandedErrors[index] && (
                                <div className="mt-2 pl-2 border-l-2 border-blue-200">
                                  <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700">
                                    {result.suggestions.map((suggestion, i) => (
                                      <li key={i}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.status === "success" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={getGoogleMapsUrl(result) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-50 ${!getGoogleMapsUrl(result) ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              <Map className="h-4 w-4" />
                              <span className="sr-only">
                                Open in Google Maps
                              </span>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open in Google Maps</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {paginatedResults.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}{" "}
          to {Math.min(currentPage * pageSize, sortedAndFilteredResults.length)}{" "}
          of {sortedAndFilteredResults.length} results
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {getPageNumbers().map((page, i) =>
              page === "ellipsis1" || page === "ellipsis2" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(Number(page))}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
