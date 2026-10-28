import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PopupContent = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string | null;
};

const SESSION_KEY = "technoshows-homepage-popup-dismissed";

export function HomepagePopup() {
  const [popup, setPopup] = useState<PopupContent | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("homepage_popup")
        .select("enabled,title,message,image_url")
        .eq("id", 1)
        .maybeSingle();
      if (!active || error || !data?.enabled) return;
      if (!data.title?.trim() && !data.message?.trim() && !data.image_url) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setPopup(data);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!popup) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopup(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [popup]);

  if (!popup) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPopup(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="homepage-popup-title" className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card shadow-2xl">
        <button type="button" onClick={() => setPopup(null)} aria-label="Close announcement" className="absolute right-3 top-3 z-10 rounded-full border bg-background/90 p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        {popup.image_url && <img src={popup.image_url} alt="" className="max-h-[45vh] w-full object-contain bg-black/20" />}
        <div className="p-6 md:p-7">
          {popup.title && <h2 id="homepage-popup-title" className="pr-8 text-2xl font-extrabold">{popup.title}</h2>}
          {popup.message && <p className={`whitespace-pre-wrap text-sm leading-6 text-foreground/80 ${popup.title ? "mt-3" : ""}`}>{popup.message}</p>}
          <button type="button" onClick={() => setPopup(null)} className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Got it</button>
        </div>
      </section>
    </div>
  );
}
