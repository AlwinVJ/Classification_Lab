import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLesson } from "@/lib/curriculum";
import { LessonTemplate } from "@/components/learning/LessonTemplate";
import { LessonShell } from "@/components/learning/LessonShell";
import { evaluationContent } from "@/content/evaluation";

export const Route = createFileRoute("/evaluation/$slug")({
  loader: ({ params }) => {
    const l = getLesson("evaluation", params.slug);
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
  const Content = evaluationContent[slug];
  if (!Content) return <LessonTemplate section="evaluation" slug={slug} />;
  return <LessonShell section="evaluation" slug={slug}><Content /></LessonShell>;
}
