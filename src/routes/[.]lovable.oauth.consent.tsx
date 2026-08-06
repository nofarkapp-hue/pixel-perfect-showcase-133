import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type OAuthClient = { name?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data?: AuthorizationDetails | null; error?: { message: string } | null };
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search['authorization_id'] === "string" ? search['authorization_id'] : "",
  }),
  head: () => ({
    meta: [
      { title: 'אישור חיבור אפליקציה - לומדת הקשב"ה' },
      {
        name: "description",
        content: "מסך אישור לחיבור כלי חיצוני לחשבון שלך בלומדת הקשב\"ה.",
      },
      { property: "og:title", content: 'אישור חיבור אפליקציה - לומדת הקשב"ה' },
      { property: "og:description", content: "אישור גישה של כלי חיצוני לחשבון שלך." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname + location.searchStr },
      });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data ?? {};
  },
  errorComponent: ({ error }) => (
    <main dir="rtl" className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-destructive">
        לא הצלחנו לטעון את בקשת ההרשאה: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
  component: Consent,
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "אפליקציה חיצונית";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("שרת ההרשאות לא החזיר כתובת חזרה.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">
          לחבר את {clientName} לחשבון שלך?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {clientName} יוכל/תוכל להשתמש בכלים של הלומדה בשמך — כולל קריאה ועדכון של
          ההתקדמות האישית שלך.
        </p>
        {details?.client?.redirect_uri && (
          <p className="mt-2 break-all text-xs text-muted-foreground">
            כתובת חזרה: {details.client.redirect_uri}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          האישור אינו עוקף את הרשאות האפליקציה — נתונים של משתמשים/ות אחרים/ות נשארים
          חסומים.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            אישור
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
          >
            ביטול
          </button>
        </div>
      </div>
    </main>
  );
}
