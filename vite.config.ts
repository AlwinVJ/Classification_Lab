// @lovable.dev/vite-tanstack-config already includes the required plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { sections } from "./src/lib/curriculum";

export default defineConfig({
  vite: {
    base: "/Classification_Lab/",
  },

  tanstackStart: {
    router: {
      basepath: "/Classification_Lab",
    },

    pages: [
      "/",
      "/resources",
      ...sections.flatMap((section) => [
        `/${section.id}`,
        ...section.lessons.map((lesson) => `/${section.id}/${lesson.slug}`),
      ]),
    ].map((path) => ({ path })),

    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: false,
    },

    // Preserve the existing server entry.
    server: {
      entry: "server",
    },
  },
});
