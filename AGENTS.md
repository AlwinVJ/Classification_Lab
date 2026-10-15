<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
# Agents
- Curriculum (sections/lessons) lives in src/lib/curriculum.ts; nav, sidebar and dynamic lesson routes derive from it — add lessons there.
- Real lesson content lives in src/content/<section>.tsx as a slug→component map; the $slug route renders it inside LessonShell and falls back to LessonTemplate placeholders.
- Site is stateless: no auth, tracking or progress storage; localStorage only for theme preference.
- Evaluation math and deterministic scored datasets live in src/lib/evaluation.ts; reusable browser-only educational controls consume them so count, threshold and curve views share the same calculations.
- Prerender all public curriculum routes from the curriculum at build time so the same stateless site can be served by root-hosted static hosting without an application server.
- Lessons may set `group`/`navTitle` in curriculum.ts to nest under a topic in the sidebar; algorithm math lives in src/lib/<algorithm>.ts (logistic.ts, knn.ts) and reuses evaluation.ts counting; each algorithm's lessons live in their own src/content file merged by the algorithms $slug route.
