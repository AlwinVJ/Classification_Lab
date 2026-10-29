import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLesson } from '@/lib/curriculum';
import { LessonShell } from '@/components/learning/LessonShell';
import { multiclassContent } from '@/content/multiclass';
export const Route = createFileRoute('/multiclass/$slug')({
 loader: ({params}) => {const found=getLesson('multiclass',params.slug);if(!found)throw notFound();return {title:found.lesson.title,summary:found.lesson.summary};},
 head: ({loaderData}) => {const title=loaderData?`${loaderData.title} — Classification Lab`:'Unavailable — Classification Lab';const description=loaderData?.summary??'This Classification Lab lesson is unavailable.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'article'},{name:'twitter:card',content:'summary_large_image'},...(!loaderData?[{name:'robots',content:'noindex'}]:[])]};},
 component: MulticlassLesson,
});
function MulticlassLesson(){const {slug}=Route.useParams();const Content=multiclassContent[slug];if(!Content)return null;return <LessonShell section="multiclass" slug={slug}><Content/></LessonShell>;}
