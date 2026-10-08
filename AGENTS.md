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
