export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { getNasaImage } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const image = await getNasaImage(id);
    return { title: image.title };
  } catch {
    return { title: "NASA Image" };
  }
}

export default async function LibraryDetailPage({ params }: Props) {
  const { id } = await params;

  let image;
  try {
    image = await getNasaImage(id);
  } catch {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-lg">Image not found: {id}</p>
        <Link href="/library" className="inline-block mt-6 text-blue-400 hover:text-blue-300 transition">
          ← Back to Library
        </Link>
      </main>
    );
  }

  const origUrl = `https://images-assets.nasa.gov/image/${id}/${id}~orig.jpg`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/library" className="text-blue-400 hover:text-blue-300 text-sm transition mb-6 inline-block">
        ← Back to Library
      </Link>

      <div className="relative w-full rounded-lg overflow-hidden bg-space-800 mb-6">
        <Image
          src={origUrl}
          alt={image.title}
          width={1200}
          height={800}
          className="w-full object-contain max-h-[70vh]"
          unoptimized
        />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">{image.title}</h1>
      {image.date_created && (
        <p className="text-slate-500 text-sm mb-4">{image.date_created}</p>
      )}

      {image.description && (
        <p className="text-slate-300 leading-relaxed mb-6">{image.description}</p>
      )}

      {image.keywords && image.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {image.keywords.map((kw) => (
            <span
              key={kw}
              className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
