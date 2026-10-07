import { createFileRoute } from "@tanstack/react-router";
import { SectionOverview, sectionHead } from "@/components/learning/SectionOverview";

export const Route = createFileRoute("/algorithms/")({
  head: () => sectionHead("algorithms"),
  component: () => <SectionOverview id="algorithms" />,
});
