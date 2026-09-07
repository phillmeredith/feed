import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { F1Calendar } from "@/components/F1Season";
import { season } from "@/lib/f1";

export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Formula One calendar — The Dispatch",
    description: `Every round of the ${season().season} season, with results and highlights.`,
  };
}

export default function F1CalendarPage() {
  return (
    <DeskView desk="f1" page={1} tab="calendar" above={<F1Calendar />} feed="none" />
  );
}
