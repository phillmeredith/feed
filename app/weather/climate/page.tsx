import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { ClimatePanel } from "@/components/ClimatePanel";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "The planet — The Dispatch",
  description:
    "Carbon dioxide, the global temperature anomaly and the state of the Pacific, from the agencies that measure them.",
};

export default function ClimatePage() {
  return (
    <DeskView
      desk="weather"
      page={1}
      tab="climate"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <ClimatePanel />
        </div>
      }
    />
  );
}
