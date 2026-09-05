import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { UfcEvents } from "@/components/UfcEvents";
import { ufcSeason } from "@/lib/ufc";

/*
 * The UFC, the same shape as Formula One and golf: the standing record above
 * the reporting, on the desk's own page.
 */
export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "The UFC — The Dispatch",
    description: `Every card of ${ufcSeason().season} — main card and prelims, results and highlights, with the reporting around them.`,
  };
}

export default function UfcDesk() {
  return <DeskView desk="ufc" page={1} above={<UfcEvents />} />;
}
