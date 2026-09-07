import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { UfcAllCards } from "@/components/UfcEvents";
import { ufcSeason } from "@/lib/ufc";

export const revalidate = 600;
export const maxDuration = 60;

export function generateMetadata(): Metadata {
  return {
    title: "Every UFC card — The Dispatch",
    description: `Every card of ${ufcSeason().season}, main card and prelims.`,
  };
}

export default function UfcCardsPage() {
  return (
    <DeskView desk="ufc" page={1} tab="cards" above={<UfcAllCards />} feed="none" />
  );
}
