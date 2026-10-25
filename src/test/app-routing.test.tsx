import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { sections } from "@/lib/curriculum";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches every curriculum overview and lesson, including the twelve Compare lessons", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(sections.find(s => s.id === 'compare')?.lessons.length).toBe(12);
    for (const section of sections) {
      expect(router.matchRoutes(`/${section.id}`).at(-1)?.routeId).not.toBe(rootRouteId);
      for (const lesson of section.lessons) expect(router.matchRoutes(`/${section.id}/${lesson.slug}`).at(-1)?.routeId).toBe(`/${section.id}/$slug`);
    }
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
