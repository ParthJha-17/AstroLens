export const dynamic = "force-dynamic";

import { getApodByDate, getBriefing } from "@/lib/api";
import ImageViewer from "@/components/ImageViewer";
import BriefingPanel from "@/components/BriefingPanel";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { date } = await params;
  try {
    const apod = await getApodByDate(date);
    return { title: apod.title };
  } catch {
    return { title: "APOD" };
  }
}

export default async function ApodDetailPage({ params }: Props) {
  const { date } = await params;

  let apod;
  try {
    apod = await getApodByDate(date);
  } catch {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-lg">No APOD found for date: {date}</p>
      </main>
    );
  }

  const existingBriefing = await getBriefing(date);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <ImageViewer apod={apod} />
      <BriefingPanel date={date} initialBriefing={existingBriefing} />
    </main>
  );
}
