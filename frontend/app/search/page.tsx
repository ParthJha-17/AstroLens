import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search APOD Archive</h1>
      <Suspense>
        <SearchBar />
        <SearchResults />
      </Suspense>
    </main>
  );
}
