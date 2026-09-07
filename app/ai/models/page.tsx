import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { ModelTable } from "@/components/ModelTable";
import { getFeed } from "@/lib/feed";
import { getAllModelReleases } from "@/lib/models";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Model releases — The Dispatch",
  description: "Every model release the desk has recorded, newest first.",
};

export default async function AiModelsPage() {
  const { articles } = await getFeed();
  const models = await getAllModelReleases(articles);

  return (
    <DeskView
      desk="ai"
      page={1}
      tab="models"
      feed="none"
      panels={false}
      above={<div className="mt-12"><ModelTable models={models} /></div>}
    />
  );
}
