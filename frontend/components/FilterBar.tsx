"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    router.replace(`/library?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
      <input
        ref={inputRef}
        defaultValue={q}
        placeholder="Search NASA Image Library... (e.g. 'nebula', 'Apollo', 'Saturn')"
        className="flex-1 px-4 py-3 bg-space-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Search
      </button>
    </form>
  );
}
