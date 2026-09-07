import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GearDirectory } from "@/components/GearDirectory";
import { getFeed } from "@/lib/feed";
import { gearDirectory } from "@/lib/gear";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Camera directory — The Dispatch",
  description: "Bodies and lenses on record, newest first.",
};

export default async function CameraDirectoryPage() {
  const { articles } = await getFeed();

  return (
    <DeskView
      desk="cameras"
      page={1}
      tab="directory"
      feed="none"
      panels={false}
      above={<div className="mt-12"><GearDirectory items={gearDirectory(articles)} /></div>}
    />
  );
}
