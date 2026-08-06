import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Get my learning progress",
  description:
    "Get the signed-in learner's own progress in the module: completed chapters, quiz score and certificate details.",
  inputSchema: {},
  outputSchema: {
    progress: z.object({
      completed_chapters: z.array(z.string()).nullable(),
      quiz_score: z.number().nullable(),
      certificate_name: z.string().nullable(),
      certificate_issued_at: z.string().nullable(),
      updated_at: z.string().nullable().optional(),
    }),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("learner_progress")
      .select(
        "completed_chapters, quiz_score, certificate_name, certificate_issued_at, updated_at",
      )
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    const progress = data ?? {
      completed_chapters: [],
      quiz_score: null,
      certificate_name: null,
      certificate_issued_at: null,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(progress) }],
      structuredContent: { progress },
    };
  },
});
