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

- TMDB calls go through createServerFn in src/lib/tmdb.functions.ts using server secret TMDB_API_KEY; why: keep the key off the client and degrade gracefully when missing.
- Video playback goes through the EmbedProvider adapter in src/lib/providers.ts using owner-supplied or documented URL formats; why: keep episode mapping explicit and only connect authorized providers.
- User library (watchlist/favourites/progress) is read/written from the browser client under RLS; why: simple per-user data with no privileged logic.
