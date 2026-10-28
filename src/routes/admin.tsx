import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { btn, Logo } from "@/components/ui-kit";

const ADMIN_EMAIL = "technoproboizz@gmail.com";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TechnoShows" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email?.trim().toLowerCase() === ADMIN_EMAIL;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("homepage_popup")
        .select("enabled,title,message,image_url")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setNotice({ ok: false, text: "Could not load popup settings. The database setup may not have been applied yet." });
      } else if (data) {
        setEnabled(data.enabled);
        setTitle(data.title);
        setMessage(data.message);
        setImageUrl(data.image_url);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authLoading, user, isAdmin, navigate]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setNotice(null);
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setNotice({ ok: false, text: "Please choose a JPG, PNG, WEBP, or GIF image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ ok: false, text: "Image must be 5 MB or smaller." });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("homepage-popup").upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      setNotice({ ok: false, text: "Image upload failed. Check that the homepage-popup database setup has been applied." });
    } else {
      const { data } = supabase.storage.from("homepage-popup").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setNotice({ ok: true, text: "Image uploaded. Save the popup to publish your changes." });
    }
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const { error } = await supabase.from("homepage_popup").upsert({
      id: 1,
      enabled,
      title: title.trim(),
      message: message.trim(),
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    setNotice(error
      ? { ok: false, text: "Could not save. Make sure the homepage popup SQL setup has been applied and you are signed in with the admin account." }
      : { ok: true, text: enabled ? "Popup is ON and published on the homepage." : "Popup is OFF. Your saved message will not be shown." });
  };

  if (authLoading || loading) return <div className="mx-auto max-w-3xl px-4 pt-32 text-sm text-muted-foreground">Loading admin panel…</div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">This admin panel is restricted to the designated TechnoShows administrator.</p>
      <Link to="/" className={`${btn.primary} mt-6`}>Go home</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div><Logo /><h1 className="mt-5 text-3xl font-extrabold">Admin panel</h1><p className="mt-2 text-sm text-muted-foreground">Homepage popup controls</p></div>
        <Link to="/" className={btn.ghost}>View site</Link>
      </div>

      <section className="space-y-6 rounded-2xl border bg-card p-5 md:p-8">
        <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div><h2 className="font-semibold">Homepage popup</h2><p className="mt-1 text-sm text-muted-foreground">Only appears on the homepage, never on show or watch pages.</p></div>
          <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} /></button>
        </div>

        <label className="block space-y-2"><span className="text-sm font-medium">Popup heading (optional)</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Important announcement" className="h-11 w-full rounded-lg border bg-input/30 px-3 outline-none focus:border-primary" /></label>
        <label className="block space-y-2"><span className="text-sm font-medium">Message text</span><textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={5} placeholder="Write the message visitors should see…" className="w-full resize-y rounded-lg border bg-input/30 p-3 outline-none focus:border-primary" /><span className="text-xs text-muted-foreground">{message.length}/2000 characters</span></label>

        <div className="space-y-3">
          <p className="text-sm font-medium">Popup image (optional)</p>
          <label className={`${btn.ghost} inline-flex cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}>{uploading ? "Uploading image…" : "Choose image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} className="sr-only" onChange={e => { void uploadImage(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF. Maximum 5 MB.</p>
          {imageUrl && <div className="space-y-2"><img src={imageUrl} alt="Popup preview" className="max-h-64 w-full rounded-xl border object-contain" /><button type="button" onClick={() => setImageUrl(null)} className="text-sm text-destructive hover:underline">Remove image</button></div>}
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-sm"><p className="font-semibold">How it works</p><p className="mt-1 text-muted-foreground">When enabled, visitors see the popup on their first homepage visit in a browser session. Closing it keeps it hidden for that session. Browsing to a movie or series will never trigger it.</p></div>
        {notice && <p role="status" className={`text-sm ${notice.ok ? "text-gold" : "text-destructive"}`}>{notice.text}</p>}
        <button type="button" disabled={saving || uploading} onClick={() => void save()} className={`${btn.primary} w-full justify-center`}>{saving ? "Saving…" : "Save popup settings"}</button>
      </section>
    </div>
  );
}
