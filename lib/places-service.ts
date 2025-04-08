"use client";

import type {
  LookupResult,
  BatchProcessingStatus,
  BatchConfig,
} from "@/types/lookup-types";

const LOCATION_LIMIT = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function trackApiUsage(count = 1): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/rate-limit?count=${count}&t=${Date.now()}`,
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to track API usage:", data);
      return false;
    }
    if (data.isLimited) {
      console.warn("API usage limit reached:", data);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to track API usage:", error);
    return true;
  }
}

async function fetchGeocode(query: string): Promise<LookupResult> {
  const canProceed = await trackApiUsage();
  if (!canProceed) {
    return {
      query,
      results: [],
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Daily request limit reached. Please try again tomorrow.",
        suggestions: [
          "Wait until your rate limit resets",
          "Try again tomorrow",
        ],
      },
    };
  }

  try {
    const response = await fetch(
      `/api/google/geocode?address=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (!response.ok || !data.results?.length) {
      return {
        query,
        results: [],
        error: {
          code: "ZERO_RESULTS",
          message: "No results found for this location",
          suggestions: [
            "Check for typos",
            "Add more context like city, state, or country",
          ],
        },
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const name =
      result.address_components?.[0]?.long_name ??
      result.formatted_address?.split(",")[0] ??
      query;

    return {
      query,
      results: [
        {
          place_id: result.place_id,
          name,
          lat: location.lat,
          lng: location.lng,
          address: result.formatted_address ?? "",
        },
      ],
    };
  } catch (error) {
    console.error("Geocode fetch error:", error);
    return {
      query,
      results: [],
      error: {
        code: "API_ERROR",
        message: "An error occurred while contacting the geocoding service.",
        suggestions: ["Try again later", "Verify the address format"],
      },
    };
  }
}

export async function performLookup(
  input: string,
  batchConfig: BatchConfig,
  onStatusUpdate: (status: BatchProcessingStatus) => void,
  isAuthenticated = false,
): Promise<{
  results: LookupResult[];
  markers: { lat: number; lng: number }[];
}> {
  try {
    console.log(`performLookup called with input: ${input}`);
    const rateLimitResponse = await fetch(`/api/rate-limit?t=${Date.now()}`);
    const rateLimitData = await rateLimitResponse.json();
    if (rateLimitData.isLimited) {
      return {
        results: [
          {
            query: "Rate Limit Exceeded",
            results: [],
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "You've reached the daily limit.",
              suggestions: ["Wait until your rate limit resets"],
            },
          },
        ],
        markers: [],
      };
    }
  } catch (e) {
    console.warn("Rate limit check failed. Proceeding anyway.");
  }

  const lines = input
    .split(/\s*\n\s*/)
    .filter((line) => line.trim().length > 0)
    .slice(0, LOCATION_LIMIT);

  const { batchSize, delayBetweenBatches } = batchConfig;
  const totalBatches = Math.ceil(lines.length / batchSize);

  const status: BatchProcessingStatus = {
    totalItems: lines.length,
    processedItems: 0,
    currentBatch: 0,
    totalBatches,
    isProcessing: true,
  };

  const lookupResults: LookupResult[] = [];
  const markers: { lat: number; lng: number }[] = [];

  const startTime = Date.now();

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    status.currentBatch = batchIndex + 1;
    onStatusUpdate({ ...status });

    const batchStart = batchIndex * batchSize;
    const batchQueries = lines.slice(batchStart, batchStart + batchSize);

    const batchResults = await Promise.all(
      batchQueries.map((query) => fetchGeocode(query)),
    );

    const rateLimitExceeded = batchResults.some(
      (r) => r.error?.code === "RATE_LIMIT_EXCEEDED",
    );
    if (rateLimitExceeded) {
      lookupResults.push({
        query: "Rate Limit Exceeded",
        results: [],
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Limit reached mid-process. Try again tomorrow.",
          suggestions: ["Wait until reset", "Try fewer queries"],
        },
      });
      break;
    }

    batchResults.forEach((r) => {
      lookupResults.push(r);
      r.results?.forEach((place) =>
        markers.push({ lat: place.lat, lng: place.lng }),
      );
    });

    status.processedItems += batchQueries.length;
    const elapsed = Date.now() - startTime;
    if (status.processedItems > 0) {
      const timePerItem = elapsed / status.processedItems;
      status.estimatedTimeRemaining =
        (status.totalItems - status.processedItems) * timePerItem;
    }

    onStatusUpdate({ ...status });

    if (batchIndex < totalBatches - 1 && delayBetweenBatches > 0) {
      await sleep(delayBetweenBatches);
    }
  }

  status.isProcessing = false;
  onStatusUpdate({ ...status });

  return { results: lookupResults, markers };
}
