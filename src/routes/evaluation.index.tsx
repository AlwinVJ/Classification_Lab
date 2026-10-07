import { createFileRoute } from "@tanstack/react-router";
import { SectionOverview, sectionHead } from "@/components/learning/SectionOverview";

export const Route = createFileRoute("/evaluation/")({
  head: () => sectionHead("evaluation"),
  component: () => <SectionOverview id="evaluation" />,
});
