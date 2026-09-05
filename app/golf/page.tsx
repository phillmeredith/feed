import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GolfSeason } from "@/components/GolfSeason";
import { golfSeason } from "@/lib/golf";

/*
 * Golf, the same shape as Formula One: the last major and its highlights,
 * every event of the season with its leaderboard, then the writing.
 */
export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Golf — The Dispatch",
    description: `The ${golfSeason().season} season: majors, leaderboards, highlights and the reporting around them.`,
  };
}

export default function GolfDesk() {
  return <DeskView desk="golf" page={1} above={<GolfSeason />} />;
}
