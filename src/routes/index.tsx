import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'לומדת נגישות ושירות מכיל - מיזם הקשב"ה' },
      {
        name: "description",
        content:
          "לומדה אינטראקטיבית לשירות מכיל ונגישות: תיאוריה, סימולציות, בוחן ותעודה.",
      },
      { property: "og:title", content: 'לומדת נגישות ושירות מכיל - הקשב"ה' },
      {
        property: "og:description",
        content: "לומדה אינטראקטיבית לשירות מכיל ונגישות לעסקים ולנותני שירות.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-screen w-full">
      <h1 className="sr-only">לומדת נגישות ושירות מכיל - מיזם הקשב"ה</h1>
      <iframe
        src="/learner.html"
        title='לומדת נגישות ושירות מכיל - מיזם הקשב"ה'
        className="h-full w-full border-0"
      />
    </main>
  );
}
