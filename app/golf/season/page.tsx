import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GolfAllEvents } from "@/components/GolfSeason";
import { golfSeason } from "@/lib/golf";

export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Golf season — The Dispatch",
    description: `Every event of ${golfSeason().season}, with leaderboards.`,
  };
}

export default function GolfSeasonPage() {
  return (
    <DeskView
      desk="golf"
      page={1}
      tab="season"
      above={<GolfAllEvents />}
      feed={false}
    />
  );
}
