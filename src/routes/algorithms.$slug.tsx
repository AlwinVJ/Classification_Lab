import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLesson } from "@/lib/curriculum";
import { LessonTemplate } from "@/components/learning/LessonTemplate";
import { LessonShell } from "@/components/learning/LessonShell";
import { algorithmsContent } from "@/content/algorithms";
import { knnContent } from "@/content/knn";

export const Route = createFileRoute("/algorithms/$slug")({
  loader: ({ params }) => {
    const l = getLesson("algorithms", params.slug);
    if (!l) throw notFound();
    return { title: l.lesson.title, summary: l.lesson.summary };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found — Classification Lab" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.title} — Classification Lab`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Lesson,
});

function Lesson() {
  const { slug } = Route.useParams();
  const Content = algorithmsContent[slug] ?? knnContent[slug];
  if (!Content) return <LessonTemplate section="algorithms" slug={slug} />;
  return <LessonShell section="algorithms" slug={slug}><Content /></LessonShell>;
}
