import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import ImageGrid from "@/components/ImageGrid";

export default function LibraryPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">NASA Image Library</h1>
      <Suspense>
        <FilterBar />
        <ImageGrid initialImages={[]} />
      </Suspense>
    </main>
  );
}
