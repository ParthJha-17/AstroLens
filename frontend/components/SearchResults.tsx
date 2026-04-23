"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { searchApod, type SearchResult } from "@/lib/api";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(false);
    searchApod(q)
      .then((data) => {
        setResults(data);
        setSearched(true);
      })
      .catch(() => {
        setResults([]);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) return null;

  if (loading) {
    return (
      <div className="mt-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (searched && results.length === 0) {
    return (
      <p className="mt-8 text-slate-400 text-center">
        No results for &ldquo;{q}&rdquo;. Try &lsquo;Hubble&rsquo;, &lsquo;Mars&rsquo;, or &lsquo;black hole&rsquo;.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {results.map((result) => (
        <a
          key={result.date}
          href={`/apod/${result.date}`}
          className="flex gap-4 p-4 bg-space-800 rounded-lg hover:bg-slate-700 transition"
        >
          {result.media_type === "video" ? (
            <div className="w-20 h-[60px] bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-xl">▶</span>
            </div>
          ) : (
            <div className="relative w-20 h-[60px] flex-shrink-0 rounded overflow-hidden">
              <Image
                src={result.url}
                alt={result.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}
          <div>
            <p className="text-slate-400 text-xs mb-1">{result.date}</p>
            <p className="text-slate-100 font-medium">{result.title}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
