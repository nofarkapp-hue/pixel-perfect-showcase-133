import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { searchChapters } from "../content";

export default defineTool({
  name: "search_content",
  title: "Search learning content",
  description:
    "Search the learning module's Hebrew text for a phrase and return matching snippets with their chapter.",
  inputSchema: {
    query: z.string().describe("Text to search for (Hebrew or English)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const results = searchChapters(query);
    return {
      content: [
        {
          type: "text" as const,
          text: results.length
            ? JSON.stringify(results, null, 2)
            : `No matches found for "${query}".`,
        },
      ],
      structuredContent: { results },
    };
  },
});
