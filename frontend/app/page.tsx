export const dynamic = "force-dynamic";

import { getApodToday } from "@/lib/api";
import TodayHero from "@/components/TodayHero";
import RecentFeed from "@/components/RecentFeed";

export default async function HomePage() {
  const apod = await getApodToday();
  return (
    <main>
      <TodayHero apod={apod} />
      <RecentFeed />
    </main>
  );
}
