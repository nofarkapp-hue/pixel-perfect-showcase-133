import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getChapters } from "../content";

export default defineTool({
  name: "list_chapters",
  title: "List learning chapters",
  description:
    "List the chapters of the Hakshava accessibility & inclusive-service learning module, with their IDs and titles.",
  inputSchema: {},
  outputSchema: {
    chapters: z.array(z.object({ id: z.string(), title: z.string() })),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const chapters = getChapters().map(({ id, title }) => ({ id, title }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(chapters, null, 2) }],
      structuredContent: { chapters },
    };
  },
});
