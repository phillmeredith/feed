import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { F1Standings } from "@/components/F1Season";
import { season } from "@/lib/f1";

export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Formula One standings — The Dispatch",
    description: `Drivers' and constructors' championships, ${season().season}.`,
  };
}

export default function F1StandingsPage() {
  return (
    <DeskView
      desk="f1"
      page={1}
      tab="standings"
      above={<F1Standings />}
      feed="none"
    />
  );
}
