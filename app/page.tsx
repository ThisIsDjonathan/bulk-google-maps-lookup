"use client";

import { PlacesLookupTool } from "@/components/places-lookup-tool";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Bulk Google Maps Lookup Tool
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Search multiple Google <strong>place_id</strong> and{" "}
            <strong>Google Maps URL</strong> at once!
          </p>
        </header>
        <PlacesLookupTool />
      </div>
    </main>
  );
}
