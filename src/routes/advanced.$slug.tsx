import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLesson } from '@/lib/curriculum';
import { LessonShell } from '@/components/learning/LessonShell';
import { advancedContent } from '@/content/advanced';
export const Route = createFileRoute('/advanced/$slug')({
  loader: ({ params }) => {
    const found = getLesson('advanced', params.slug);
    if (!found) throw notFound();
    return { title: found.lesson.title, summary: found.lesson.summary };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Classification Lab` : 'Unavailable — Classification Lab';
    const description = loaderData?.summary ?? 'This Classification Lab lesson is unavailable.';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary_large_image' }, ...(!loaderData ? [{ name: 'robots', content: 'noindex' }] : [])] };
  },
  component: AdvancedLesson,
});
function AdvancedLesson() {
  const { slug } = Route.useParams();
  const Content = advancedContent[slug];
  if (!Content) return null;
  return <LessonShell section="advanced" slug={slug}><Content /></LessonShell>;
}