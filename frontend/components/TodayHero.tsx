import Image from "next/image";
import Link from "next/link";
import type { ApodItem } from "@/lib/api";

export default function TodayHero({ apod }: { apod: ApodItem }) {
  const excerpt = apod.explanation.split(". ").slice(0, 2).join(". ") + ".";

  return (
    <section className="relative w-full h-[600px] overflow-hidden bg-space-800">
      {apod.media_type === "video" ? (
        <iframe
          src={apod.url}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <Image
          src={apod.url}
          alt={apod.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Date badge top-left */}
      <span className="absolute top-4 left-4 bg-black/50 text-slate-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
        {apod.date}
      </span>

      {/* Text overlay bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight max-w-3xl">
          {apod.title}
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-2xl mb-5 line-clamp-2">
          {excerpt}
        </p>
        <Link
          href={`/apod/${apod.date}`}
          className="inline-block bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Read Full Briefing →
        </Link>
      </div>
    </section>
  );
}
