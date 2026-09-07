import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Golf writing — The Dispatch",
  description: "The reporting around the tour.",
};

export default function GolfArticlesPage() {
  return <DeskView desk="golf" page={1} tab="" />;
}
