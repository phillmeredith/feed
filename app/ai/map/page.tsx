import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { ModelMap } from "@/components/ModelMap";
import { ModelMeasures } from "@/components/ModelMeasures";
import { BenchmarkBoard } from "@/components/BenchmarkBoard";
import { benchmarksUpdated } from "@/lib/benchmarks";
import { modelHistory } from "@/lib/modelmap";
import { catalogueUpdated } from "@/lib/catalogue";
import { BandHead } from "@/components/Band";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "The model map — The Dispatch",
  description:
    "What the models can actually do, benchmark by benchmark, plotted against the day each was released — and beneath it the catalogue read as a history.",
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
          <p className="source mb-8">
            Benchmarks updated{" "}
            {new Date(benchmarksUpdated()).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}{" "}
            · catalogue updated {updated} · {history.points.length} models
            priced
          </p>

          <BenchmarkBoard />

          <div className="mt-20">
            <BandHead
              weight="major"
              title="And what they cost to run"
              note="The catalogue read as a history rather than a price list."
            />
            <ModelMap history={history} />
            <ModelMeasures history={history} />
          </div>
        </div>
      }
    />
  );
}
