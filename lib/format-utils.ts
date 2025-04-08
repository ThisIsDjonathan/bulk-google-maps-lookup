import type { LookupResult } from "@/types/lookup-types";

// Generate Google Maps URL based on place data
function getGoogleMapsUrl(
  place_id?: string,
  lat?: number,
  lng?: number,
): string {
  if (place_id) {
    // If we have a place_id, use that for a more precise link
    return `https://www.google.com/maps/place/?q=place_id:${place_id}`;
  } else if (lat && lng) {
    // Otherwise use coordinates
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  return "";
}

export function formatResultsAsCSV(results: LookupResult[]): string {
  if (results.length === 0) return "";

  const csvLines: string[] = [];

  // Add header row
  csvLines.push(
    '"Input","Status","Name","Latitude","Longitude","Address","Place ID","Google Maps URL","Error","Suggestions"',
  );

  results.forEach((lookupResult) => {
    if (lookupResult.error) {
      // Error case
      csvLines.push(
        `"${escapeQuotes(lookupResult.query)}",` +
          `"Error",` +
          `"",` +
          `0,` +
          `0,` +
          `"",` +
          `"",` +
          `"",` +
          `"${escapeQuotes(lookupResult.error.message)}",` +
          `"${escapeQuotes(lookupResult.error.suggestions?.join("; ") || "")}"`,
      );
    } else if (lookupResult.results.length === 0) {
      // No results for this query
      csvLines.push(
        `"${escapeQuotes(lookupResult.query)}",` +
          `"No Results",` +
          `"",` +
          `0,` +
          `0,` +
          `"",` +
          `"",` +
          `"",` +
          `"No results found",` +
          `"Try a different search term"`,
      );
    } else {
      // Add a line for each result
      lookupResult.results.forEach((place) => {
        const mapsUrl = getGoogleMapsUrl(place.place_id, place.lat, place.lng);
        csvLines.push(
          `"${escapeQuotes(lookupResult.query)}",` +
            `"Success",` +
            `"${escapeQuotes(place.name || "")}",` +
            `${place.lat},` +
            `${place.lng},` +
            `"${escapeQuotes(place.address)}",` +
            `${place.place_id},` +
            `"${mapsUrl}",` +
            `"",` +
            `""`,
        );
      });
    }
  });

  return csvLines.join("\n");
}

function escapeQuotes(str: string | null): string {
  if (!str) return "";
  return str.replace(/"/g, '""');
}
