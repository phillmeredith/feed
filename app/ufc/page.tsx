import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "UFC writing — The Dispatch",
  description: "The reporting around the fight game.",
};

export default function UfcArticlesPage() {
  return <DeskView desk="ufc" page={1} tab="" />;
}
