import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { PatentsPanel } from "@/components/PatentsPanel";
import { getPatents } from "@/lib/patents";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Robotics patents — The Dispatch",
  description: "Filings by the manufacturers this desk covers.",
};

export default async function RoboticsPatentsPage() {
  const filings = await getPatents("robotics");

  return (
    <DeskView
      desk="robotics"
      page={1}
      tab="patents"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <PatentsPanel filings={filings} />
        </div>
      }
    />
  );
}
