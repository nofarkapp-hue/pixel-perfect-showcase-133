import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    next: safeNext(search['next']),
  }),
  head: () => ({
    meta: [
      { title: 'משלימים כניסה - לומדת הקשב"ה' },
      { name: "description", content: "השלמת תהליך הכניסה לחשבון בלומדה." },
      { property: "og:title", content: 'משלימים כניסה - לומדת הקשב"ה' },
      { property: "og:description", content: "השלמת תהליך הכניסה לחשבון בלומדה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { next } = Route.useSearch();
  const [message, setMessage] = useState("מסיימים את הכניסה…");

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) window.location.replace(next);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) window.location.replace(next);
    });

    const timer = setTimeout(() => {
      if (!cancelled) setMessage("לא הצלחנו להשלים את הכניסה. אפשר לנסות שוב מדף הכניסה.");
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [next]);

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
