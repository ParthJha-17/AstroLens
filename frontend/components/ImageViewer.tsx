import Image from "next/image";
import type { ApodItem } from "@/lib/api";

export default function ImageViewer({ apod }: { apod: ApodItem }) {
  return (
    <div>
      <div className="relative w-full max-h-[70vh] overflow-hidden rounded-lg bg-space-800 flex items-center justify-center">
        {apod.media_type === "video" ? (
          <iframe
            src={apod.url}
            className="w-full aspect-video border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full" style={{ maxHeight: "70vh" }}>
            <Image
              src={apod.url}
              alt={apod.title}
              width={1200}
              height={800}
              className="w-full object-contain max-h-[70vh]"
              priority
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">{apod.title}</h1>
        <p className="text-slate-500 text-sm mb-4">{apod.date}</p>
        <p className="text-slate-300 leading-relaxed">{apod.explanation}</p>
        {apod.hdurl && (
          <a
            href={apod.hdurl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm transition"
          >
            View HD →
          </a>
        )}
      </div>
    </div>
  );
}
