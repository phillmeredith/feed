import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Weather — The Dispatch",
  description:
    "Today's forecast in full: what it's doing, when to go out, and where to go.",
};

/*
 * Weather is the one desk where the reporting is not the front page.
 *
 * Everywhere else the articles are what a desk is for and the standing
 * material earns a tab. Nobody opens a weather page to read about weather;
 * they open it to find out what it is doing, so the forecast is the desk and
 * the writing is the tab.
 */
export default function WeatherPage() {
  return <DeskView desk="weather" page={1} tab="" feed="brief" />;
}
