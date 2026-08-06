import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "save_my_progress",
  title: "Save my learning progress",
  description:
    "Update the signed-in learner's own progress: completed chapter IDs, quiz score, and certificate name. Only fields that are provided are changed.",
  inputSchema: {
    completedChapters: z
      .array(z.string().min(1).max(64))
      .max(50)
      .optional()
      .describe("Chapter IDs the learner has completed."),
    quizScore: z.number().int().min(0).max(100).optional().describe("Quiz score 0-100."),
    certificateName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional()
      .describe("Name to print on the certificate."),
  },
  outputSchema: {
    progress: z.object({
      completed_chapters: z.array(z.string()).nullable(),
      quiz_score: z.number().nullable(),
      certificate_name: z.string().nullable(),
      certificate_issued_at: z.string().nullable(),
    }),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;

    const patch: Record<string, unknown> = { user_id: userId };
    if (input.completedChapters) patch['completed_chapters'] = input.completedChapters;
    if (input.quizScore !== undefined) patch['quiz_score'] = input.quizScore;
    if (input.certificateName) {
      patch['certificate_name'] = input.certificateName;
      patch['certificate_issued_at'] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("learner_progress")
      .upsert(patch, { onConflict: "user_id" })
      .select("completed_chapters, quiz_score, certificate_name, certificate_issued_at")
      .single();
    if (error) throw new ToolError(error.message);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { progress: data },
    };
  },
});
