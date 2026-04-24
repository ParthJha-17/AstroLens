"use client";

import { useState, useEffect } from "react";
import { getBriefing, generateBriefing, type Briefing } from "@/lib/api";
import SourceList from "@/components/SourceList";

type State = "loading" | "ready" | "prompt" | "generating" | "error";

interface BriefingPanelProps {
  date: string;
  initialBriefing: Briefing | null;
}

export default function BriefingPanel({ date, initialBriefing }: BriefingPanelProps) {
  const [state, setState] = useState<State>(initialBriefing ? "ready" : "loading");
  const [briefing, setBriefing] = useState<Briefing | null>(initialBriefing);

  useEffect(() => {
    if (initialBriefing) return;
    getBriefing(date)
      .then((b) => {
        if (b) {
          setBriefing(b);
          setState("ready");
        } else {
          setState("prompt");
        }
      })
      .catch(() => setState("prompt"));
  }, [date, initialBriefing]);

  async function handleGenerate() {
    setState("generating");
    const timeout = setTimeout(() => setState("error"), 30_000);
    try {
      const b = await generateBriefing(date);
      clearTimeout(timeout);
      setBriefing(b);
      setState("ready");
    } catch {
      clearTimeout(timeout);
      setState("error");
    }
  }

  if (state === "loading") {
    return (
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (state === "prompt") {
    return (
      <div className="mt-8 bg-space-800 border border-slate-700 rounded-lg p-6 flex flex-col items-start gap-3">
        <p className="text-slate-400">No briefing yet for this image.</p>
        <button
          onClick={handleGenerate}
          className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Generate AI Briefing
        </button>
      </div>
    );
  }

  if (state === "generating") {
    return (
      <div className="mt-8 bg-space-800 border border-slate-700 rounded-lg p-6 flex items-center gap-4">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <p className="text-slate-400">Searching the web for context...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-8 bg-space-800 border border-red-900 rounded-lg p-6 flex flex-col items-start gap-3">
        <p className="text-red-400">Briefing generation failed. Please try again.</p>
        <button
          onClick={handleGenerate}
          className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <section className="mt-8">
      <h2 className="text-blue-400 text-xl font-semibold mb-4">AI Briefing</h2>
      <div className="bg-space-800 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-purple-400 font-medium mb-2">Mission Context</h3>
          <p className="text-slate-300">{briefing.mission_context}</p>
        </div>
        <div>
          <h3 className="text-purple-400 font-medium mb-2">Scientific Significance</h3>
          <p className="text-slate-300">{briefing.scientific_significance}</p>
        </div>
        <div>
          <h3 className="text-purple-400 font-medium mb-2">Key Facts</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {briefing.key_facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
        <SourceList sources={briefing.sources} />
      </div>
    </section>
  );
}
