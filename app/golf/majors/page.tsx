import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GolfMajors } from "@/components/GolfSeason";
import { golfSeason } from "@/lib/golf";

export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "The majors — The Dispatch",
    description: `The four that decide a career, ${golfSeason().season}.`,
  };
}

export default function GolfMajorsPage() {
  return (
    <DeskView desk="golf" page={1} tab="majors" above={<GolfMajors />} feed="none" />
  );
}
