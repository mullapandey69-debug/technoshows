CREATE TABLE public.watchlist (
  user_id uuid NOT NULL,
  show_id integer NOT NULL,
  kind text NOT NULL DEFAULT 'watchlist' CHECK (kind IN ('watchlist','favorite')),
  title text NOT NULL,
  poster_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, show_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own watchlist select" ON public.watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own watchlist insert" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own watchlist delete" ON public.watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.watch_progress (
  user_id uuid NOT NULL,
  show_id integer NOT NULL,
  season integer NOT NULL,
  episode integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  backdrop_path text,
  episode_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, show_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_progress TO authenticated;
GRANT ALL ON public.watch_progress TO service_role;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress select" ON public.watch_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own progress insert" ON public.watch_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.watch_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own progress delete" ON public.watch_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);