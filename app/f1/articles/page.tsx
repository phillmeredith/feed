import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Formula One writing — The Dispatch",
  description: "The reporting that runs between races.",
};

export default function F1ArticlesPage() {
  return <DeskView desk="f1" page={1} tab="articles" />;
}
