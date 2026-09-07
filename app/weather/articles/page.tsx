import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Weather writing — The Dispatch",
  description: "The reporting on the climate system and the events it drives.",
};

export default function WeatherArticlesPage() {
  return <DeskView desk="weather" page={1} tab="articles" panels={false} />;
}
