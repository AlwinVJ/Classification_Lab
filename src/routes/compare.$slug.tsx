import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLesson } from '@/lib/curriculum';
import { LessonShell } from '@/components/learning/LessonShell';
import { compareContent } from '@/content/compare';

export const Route = createFileRoute('/compare/$slug')({
  loader: ({ params }) => {
    const found = getLesson('compare', params.slug);
    if (!found) throw notFound();
    return { title: found.lesson.title, summary: found.lesson.summary };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Classification Lab` : 'Unavailable — Classification Lab';
    const description = loaderData?.summary ?? 'This Classification Lab lesson is unavailable.';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary_large_image' }, ...(!loaderData ? [{ name: 'robots', content: 'noindex' }] : [])] };
  },
  component: CompareLesson,
});

function CompareLesson() {
  const { slug } = Route.useParams();
  const Content = compareContent[slug];
  if (!Content) return null;
  return <LessonShell section="compare" slug={slug}><Content /></LessonShell>;
}