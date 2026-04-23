import Image from "next/image";
import Link from "next/link";
import { getApodFeed } from "@/lib/api";

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export default async function RecentFeed() {
  const end = formatDate(1);
  const start = formatDate(7);
  const items = await getApodFeed(start, end);

  return (
    <section className="px-4 md:px-8 py-8">
      <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">
        Recent Astronomy Pictures
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-7 md:overflow-visible">
        {items.map((item) => (
          <Link
            key={item.date}
            href={`/apod/${item.date}`}
            className="flex-shrink-0 w-40 md:w-auto"
          >
            <div className="bg-space-800 rounded-lg overflow-hidden hover:ring-1 hover:ring-blue-400 transition">
              {item.media_type === "video" ? (
                <div className="w-full h-32 bg-slate-700 flex items-center justify-center">
                  <span className="text-3xl">▶</span>
                </div>
              ) : (
                <div className="relative w-full h-32">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 160px, 14vw"
                  />
                </div>
              )}
              <div className="p-2">
                <p className="text-slate-400 text-xs">{item.date}</p>
                <p className="text-slate-100 text-sm line-clamp-2">{item.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
