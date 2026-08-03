import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getChapter, getChapters } from "../content";

export default defineTool({
  name: "get_chapter",
  title: "Get chapter content",
  description:
    "Get the full Hebrew text of one chapter of the learning module. Use list_chapters first to find valid IDs.",
  inputSchema: {
    id: z.string().describe("Chapter ID, e.g. 'intro', 'theory', 'story3'."),
  },
  outputSchema: {
    chapter: z.object({ id: z.string(), title: z.string(), text: z.string() }),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const chapter = getChapter(id);
    if (!chapter) {
      const known = getChapters()
        .map((c) => c.id)
        .join(", ");
      throw new ToolError(`Unknown chapter "${id}". Available chapters: ${known}`);
    }
    return {
      content: [{ type: "text" as const, text: `# ${chapter.title}\n\n${chapter.text}` }],
      structuredContent: { chapter },
    };
  },
});
