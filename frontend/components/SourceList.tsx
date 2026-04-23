import type { Briefing } from "@/lib/api";

type Source = Briefing["sources"][number];

const icons: Record<Source["type"], string> = {
  web: "🌐",
  reddit: "🔴",
  youtube: "▶️",
};

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div>
      <h3 className="text-purple-400 font-medium mb-3">Sources</h3>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-sm text-slate-200 transition"
          >
            <span>{icons[s.type]}</span>
            <span className="max-w-[200px] truncate">{s.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
