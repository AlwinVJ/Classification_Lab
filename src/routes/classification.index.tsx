import { createFileRoute } from "@tanstack/react-router";
import { SectionOverview, sectionHead } from "@/components/learning/SectionOverview";

export const Route = createFileRoute("/classification/")({
  head: () => sectionHead("classification"),
  component: () => <SectionOverview id="classification" />,
});
