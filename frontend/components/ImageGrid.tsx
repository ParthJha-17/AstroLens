"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { searchImages, type NasaImage } from "@/lib/api";

export default function ImageGrid({ initialImages }: { initialImages: NasaImage[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [images, setImages] = useState<NasaImage[]>(initialImages);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!q) {
      setImages([]);
      setPage(1);
      setHasMore(false);
      return;
    }
    setLoading(true);
    setPage(1);
    searchImages(q, 1)
      .then((data) => {
        setImages(data);
        setHasMore(data.length === 20);
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [q]);

  async function loadMore() {
    if (!q || loading) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const data = await searchImages(q, nextPage);
      setImages((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 20);
    } finally {
      setLoading(false);
    }
  }

  if (!q) {
    return (
      <div className="text-center py-16 text-slate-500">
        Search for NASA images above to browse the library.
      </div>
    );
  }

  if (loading && images.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Link key={image.nasa_id} href={`/library/${image.nasa_id}`}>
            <div className="relative group overflow-hidden rounded-lg bg-space-800 aspect-square">
              {image.thumb_url ? (
                <Image
                  src={image.thumb_url}
                  alt={image.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <span className="text-4xl">🌌</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-xs line-clamp-2">{image.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-center text-slate-400 mt-8">
          No images found for &ldquo;{q}&rdquo;.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-space-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
