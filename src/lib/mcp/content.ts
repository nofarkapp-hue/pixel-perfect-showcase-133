// Extracts readable text from the static learning module (public/learner.html).
// The HTML is inlined at build time so the tools work in the Worker runtime.
import learnerHtml from "../../../public/learner.html?raw";

export type Chapter = {
  id: string;
  title: string;
  text: string;
};

const TITLES: Record<string, string> = {
  intro: "מבוא ללומדה",
  theory: "מושגים וכללי יסוד",
  disabilities: "סמלים ואתגרים שקופים",
  quiz: "בוחן ידע",
  story: "הסיפור של יובל",
  story2: "הסיפור של מיכל",
  story3: "הסיפור של רותם",
  business: "חיבור למציאות בשטח",
  summary: "סיכום ותעודה",
};

function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

let cache: Chapter[] | null = null;

export function getChapters(): Chapter[] {
  if (cache) return cache;
  const chapters: Chapter[] = [];
  const re = /<section id="tab-([a-z0-9]+)"[\s\S]*?(?=<section id="tab-|<\/main>|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(learnerHtml)) !== null) {
    const id = match[1]!;
    const text = toText(match[0]!);
    if (!text) continue;
    chapters.push({ id, title: TITLES[id] ?? id, text });
  }
  cache = chapters;
  return chapters;
}

export function getChapter(id: string): Chapter | undefined {
  return getChapters().find((chapter) => chapter.id === id);
}

export function searchChapters(query: string, limit = 10) {
  const needle = query.trim();
  if (!needle) return [];
  const results: { chapterId: string; chapterTitle: string; snippet: string }[] = [];
  for (const chapter of getChapters()) {
    for (const line of chapter.text.split("\n")) {
      if (line.includes(needle)) {
        results.push({ chapterId: chapter.id, chapterTitle: chapter.title, snippet: line.trim() });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
