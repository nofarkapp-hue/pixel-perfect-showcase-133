import { defineMcp } from "@lovable.dev/mcp-js";

import getChapterTool from "./tools/get-chapter";
import listChaptersTool from "./tools/list-chapters";
import searchContentTool from "./tools/search-content";

export default defineMcp({
  name: "pixel-perfect-pixel",
  title: "Pixel Perfect Pixel",
  version: "0.1.0",
  instructions:
    "Read-only access to the Hakshava (הקשב\"ה) Hebrew learning module on accessibility and inclusive service. Use list_chapters to see the chapters, get_chapter to read one, and search_content to find a phrase.",
  tools: [listChaptersTool, getChapterTool, searchContentTool],
});
