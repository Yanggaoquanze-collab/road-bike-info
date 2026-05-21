import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../config";

export async function GET() {
  const news = await getCollection("news", ({ data }) => !data.draft);
  const sorted = news.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: `${SITE.title} — 新闻`,
    description: SITE.description,
    site: SITE.url,
    items: sorted.map((item) => ({
      title: item.data.title,
      pubDate: item.data.date,
      description: item.data.summary || "",
      link: `/news/${item.id}`,
      ...(item.data.sourceUrl ? { customData: `<source url="${item.data.sourceUrl}">${item.data.source}</source>` } : {}),
    })),
    customData: `<language>zh-CN</language>`,
  });
}
