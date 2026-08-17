import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { saveMyProgress } from "@/lib/progress.functions";
import { logCompletionToSheet } from "@/lib/sheets.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'לומדת נגישות ושירות מכיל - מיזם הקשב"ה' },
      {
        name: "description",
        content:
          "לומדה אינטראקטיבית לשירות מכיל ונגישות: תיאוריה, סימולציות, בוחן ותעודה.",
      },
      { property: "og:title", content: 'לומדת נגישות ושירות מכיל - הקשב"ה' },
      {
        property: "og:description",
        content: "לומדה אינטראקטיבית לשירות מכיל ונגישות לעסקים ולנותני שירות.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ProgressMessage = {
  type: "hakshava-progress";
  completedChapters?: string[];
  quizScore?: number | null;
  certificateName?: string | null;
};

type CompletionMessage = {
  type: "hakshava-completion";
  name?: string;
  email?: string;
  organization?: string;
  role?: string;
  workStartDate?: string;
  completionDate?: string;
  score?: number;
  bizQ1?: string;
  bizQ2?: string;
  bizQ3?: string;
  bizQ4?: string;
  bizQ5?: string;
};

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const lastPayload = useRef<string>("");
  const lastCompletion = useRef<string>("");


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as ProgressMessage | undefined;
      if (!data || data.type !== "hakshava-progress") return;

      const payload = {
        ...(data.completedChapters ? { completedChapters: data.completedChapters } : {}),
        ...(typeof data.quizScore === "number" ? { quizScore: data.quizScore } : {}),
        ...(data.certificateName ? { certificateName: data.certificateName } : {}),
      };
      const signature = JSON.stringify(payload);
      if (!signature || signature === "{}" || signature === lastPayload.current) return;
      lastPayload.current = signature;
      void saveMyProgress({ data: payload }).catch(() => {
        /* progress sync is best-effort */
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user]);

  useEffect(() => {
    function onCompletion(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as CompletionMessage | undefined;
      if (!data || data.type !== "hakshava-completion") return;
      if (!data.name || !data.organization || !data.role || !data.completionDate) return;

      const payload = {
        name: data.name,
        email: data.email ?? "",
        organization: data.organization,
        role: data.role,
        workStartDate: data.workStartDate ?? "",
        completionDate: data.completionDate,
        score: typeof data.score === "number" ? data.score : 0,
        bizQ1: data.bizQ1 ?? "",
        bizQ2: data.bizQ2 ?? "",
        bizQ3: data.bizQ3 ?? "",
        bizQ4: data.bizQ4 ?? "",
        bizQ5: data.bizQ5 ?? "",
      };
      const signature = JSON.stringify(payload);
      if (signature === lastCompletion.current) return;
      lastCompletion.current = signature;
      void logCompletionToSheet({ data: payload }).catch(() => {
        /* sheet logging is best-effort */
      });
    }

    window.addEventListener("message", onCompletion);
    return () => window.removeEventListener("message", onCompletion);
  }, []);



  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main dir="rtl" className="flex h-screen w-full flex-col">
      <h1 className="sr-only">לומדת נגישות ושירות מכיל - מיזם הקשב"ה</h1>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-sm">
        <span className="text-muted-foreground">
          {user
            ? "ההתקדמות שלך נשמרת בחשבון האישי"
            : "כניסה לחשבון תשמור את ההתקדמות והתעודה שלך"}
        </span>
        {ready &&
          (user ? (
            <div className="flex items-center gap-3">
              <span className="text-foreground">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-md border border-input bg-background px-3 py-1 text-foreground transition-colors hover:bg-accent"
              >
                יציאה
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              search={{ next: "/" }}
              className="rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              כניסה / הרשמה
            </Link>
          ))}
      </div>
      <iframe
        src="/learner.html"
        title='לומדת נגישות ושירות מכיל - מיזם הקשב"ה'
        className="w-full flex-1 border-0"
      />
    </main>
  );
}
