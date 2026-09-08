import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { LaunchSchedule } from "@/components/LaunchSchedule";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "The launch schedule — The Dispatch",
  description:
    "Every launch on the books, soonest first, with how firmly each date is actually being given.",
};

export default function LaunchesPage() {
  return (
    <DeskView
      desk="science"
      page={1}
      tab="launches"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <LaunchSchedule />
        </div>
      }
    />
  );
}
