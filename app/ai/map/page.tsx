import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { ModelMap } from "@/components/ModelMap";
import { ModelMeasures } from "@/components/ModelMeasures";
import { modelHistory } from "@/lib/modelmap";
import { catalogueUpdated } from "@/lib/catalogue";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "The model map — The Dispatch",
  description:
    "Every model in the catalogue by release date and context window, from 2023 to now — with what the same rows say about release cadence, how many labs are shipping and what a new model costs.",
};

export default function ModelMapPage() {
  const history = modelHistory();
  const updated = new Date(catalogueUpdated()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <DeskView
      desk="ai"
      page={1}
      tab="map"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <p className="standfirst max-w-[44em] text-[1.15rem]">
            Every model the catalogue holds, placed by the day it was released
            and by how much it can be given at once. Three years of them, and
            room on the right for what has not shipped yet — the map redraws
            itself each time the catalogue does.
          </p>
          <p className="source mt-4">
            {history.points.length} models · {history.span.from.slice(0, 4)} to
            today · catalogue updated {updated}
          </p>

          <ModelMap history={history} />
          <ModelMeasures history={history} />
        </div>
      }
    />
  );
}
