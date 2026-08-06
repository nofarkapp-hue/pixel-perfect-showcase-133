import { auth, defineMcp } from "@lovable.dev/mcp-js";

import getChapterTool from "./tools/get-chapter";
import getMyProgressTool from "./tools/get-my-progress";
import listChaptersTool from "./tools/list-chapters";
import saveMyProgressTool from "./tools/save-my-progress";
import searchContentTool from "./tools/search-content";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "pixel-perfect-pixel",
  title: "Pixel Perfect Pixel",
  version: "0.2.0",
  instructions:
    "Tools for the Hakshava (הקשב\"ה) Hebrew learning module on accessibility and inclusive service. Callers sign in as a learner of this app. Use list_chapters, get_chapter and search_content to read the material, and get_my_progress / save_my_progress for the signed-in learner's own private progress.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listChaptersTool,
    getChapterTool,
    searchContentTool,
    getMyProgressTool,
    saveMyProgressTool,
  ],
});
