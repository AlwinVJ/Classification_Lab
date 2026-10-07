import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLesson } from "@/lib/curriculum";
import { LessonTemplate } from "@/components/learning/LessonTemplate";

export const Route = createFileRoute("/classification/$slug")({
  loader: ({ params }) => {
    const l = getLesson("classification", params.slug);
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
      ],
    };
  },
  component: Lesson,
});

function Lesson() {
  const { slug } = Route.useParams();
  return <LessonTemplate section="classification" slug={slug} />;
}
