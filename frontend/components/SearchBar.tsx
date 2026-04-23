"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timer.current);
      const value = e.target.value;
      timer.current = setTimeout(() => {
        router.replace(`/search?q=${encodeURIComponent(value)}`);
      }, 300);
    },
    [router],
  );

  return (
    <input
      defaultValue={q}
      onChange={handleChange}
      placeholder="Search for images... (e.g. 'black hole', 'Hubble', 'Mars')"
      className="w-full px-4 py-3 bg-space-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}
