import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const progressInput = z.object({
  completedChapters: z.array(z.string().min(1).max(64)).max(50).optional(),
  quizScore: z.number().int().min(0).max(100).nullable().optional(),
  certificateName: z.string().trim().min(1).max(120).nullable().optional(),
});

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("learner_progress")
      .select("completed_chapters, quiz_score, certificate_name, certificate_issued_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => progressInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { user_id: context.userId };
    if (data.completedChapters) patch['completed_chapters'] = data.completedChapters;
    if (data.quizScore !== undefined && data.quizScore !== null) {
      patch['quiz_score'] = data.quizScore;
    }
    if (data.certificateName) {
      patch['certificate_name'] = data.certificateName;
      patch['certificate_issued_at'] = new Date().toISOString();
    }

    const { error } = await context.supabase
      .from("learner_progress")
      .upsert(patch, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
