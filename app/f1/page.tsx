import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { F1Season } from "@/components/F1Season";
import { season } from "@/lib/f1";

/*
 * Formula One is a desk, not a reference page bolted to the side of a "Sport"
 * section. It carries the season — the last race, its highlights, every round
 * and the standings — and then the reporting, in one place, on its own URL.
 *
 * This route shadows /[desk] for the same slug, which is what lets the desk
 * bring its own material without every other desk paying for it.
 */
export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Formula One — The Dispatch",
    description: `The ${season().season} season race by race, with highlights, standings and the reporting between rounds.`,
  };
}

export default function F1Desk() {
  return <DeskView desk="f1" page={1} above={<F1Season />} />;
}
