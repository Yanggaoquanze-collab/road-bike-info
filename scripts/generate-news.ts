/**
 * 公路车新闻自动生成脚本
 *
 * 工作流程：
 * 1. 从配置的 RSS 源抓取最新文章
 * 2. 与已有新闻对比去重（按 sourceUrl 判断）
 * 3. 调用 Claude API 生成中文摘要（100-150 字）
 * 4. 写入 src/content/news/_auto/ 目录
 *
 * 环境变量：
 *   ANTHROPIC_API_KEY — Claude API 密钥
 *
 * 用法：
 *   npx tsx scripts/generate-news.ts           # 处理所有 RSS 源
 *   npx tsx scripts/generate-news.ts --dry-run # 预览但不写入文件
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ========== 配置 ==========

const RSS_FEEDS = [
  {
    name: "CyclingNews",
    url: "https://www.cyclingnews.com/rss/",
    lang: "en",
  },
  {
    name: "VeloNews",
    url: "https://velo.outsideonline.com/feed/",
    lang: "en",
  },
  {
    name: "BikeRadar",
    url: "https://www.bikeradar.com/feed",
    lang: "en",
  },
];

const MAX_PER_FEED = 3;
const MAX_TOTAL = 8;
const CONTENT_DIR = "src/content/news/_auto";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `你是一个专业的公路车资讯编辑。请用中文撰写一条简洁的公路车新闻摘要。

要求：
- 100-150 字
- 包含关键事实（谁、什么、何时）
- 语气专业但平易近人
- 标题使用中文
- 标签 1-3 个（中文）
- 直接输出 JSON 格式，不要 markdown 代码块

输出格式：
{
  "title": "中文新闻标题",
  "summary": "100-150字中文摘要",
  "tags": ["标签1", "标签2"]
}`;

// ========== 类型 ==========

interface NewsItem {
  title: string;
  sourceUrl: string;
  source: string;
  date: string;
  summary: string;
  tags: string[];
}

interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
}

// ========== RSS 解析 ==========

async function fetchFeed(feedUrl: string): Promise<RawArticle[]> {
  const text = await fetch(feedUrl, {
    headers: { "User-Agent": "RoadBikeInfo/1.0" },
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${feedUrl}`);
    return r.text();
  });

  const items: RawArticle[] = [];
  // 简易 XML 解析（避免依赖 fast-xml-parser）
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const desc = extractTag(item, "description");
    if (title && link) {
      items.push({
        title: decodeXml(title),
        link: decodeXml(link),
        pubDate: pubDate ? decodeXml(pubDate) : new Date().toISOString(),
        contentSnippet: desc ? stripHtml(decodeXml(desc)).slice(0, 500) : undefined,
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ========== 去重 ==========

function getExistingUrls(): Set<string> {
  const existing = new Set<string>();
  const autoDir = path.resolve(CONTENT_DIR);
  if (!fs.existsSync(autoDir)) return existing;

  for (const file of fs.readdirSync(autoDir)) {
    if (!file.endsWith(".md")) continue;
    const content = fs.readFileSync(path.join(autoDir, file), "utf-8");
    const m = content.match(/sourceUrl:\s*"(.+?)"/);
    if (m) existing.add(m[1]);
  }
  return existing;
}

// ========== Claude API ==========

async function generateSummary(article: RawArticle): Promise<NewsItem | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 环境变量未设置");
  }

  const userContent = `英文标题：${article.title}
发布时间：${article.pubDate}
来源链接：${article.link}
内容摘要：${article.contentSnippet || "(无)"}

请将以上内容转换为中文公路车资讯。`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error: ${resp.status} ${err}`);
  }

  const json = await resp.json();
  const text = json.content?.[0]?.text || "";
  try {
    const parsed = JSON.parse(text);
    return {
      title: parsed.title || article.title,
      sourceUrl: article.link,
      source: "AI",
      date: new Date(article.pubDate).toISOString().slice(0, 10),
      summary: parsed.summary || "",
      tags: parsed.tags || [],
    };
  } catch {
    console.error("  Claude 返回内容解析失败:", text.slice(0, 200));
    return null;
  }
}

// ========== 文件写入 ==========

function writeNewsFile(item: NewsItem, dryRun: boolean): string {
  const date = item.date;
  const slug = item.title
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase() || "untitled";

  const filename = `${date}-${slug}.md`;
  const filepath = path.resolve(CONTENT_DIR, filename);

  const frontmatter = [
    "---",
    `title: "${item.title}"`,
    `date: ${item.date}`,
    `author: "AI"`,
    `source: "RSS"`,
    `sourceUrl: "${item.sourceUrl}"`,
    item.tags.length > 0 ? `tags: [${item.tags.map((t) => `"${t}"`).join(", ")}]` : "",
    `summary: "${item.summary.replace(/"/g, '\\"')}"`,
    "draft: false",
    "---",
    "",
    item.summary,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!dryRun) {
    fs.mkdirSync(path.resolve(CONTENT_DIR), { recursive: true });
    fs.writeFileSync(filepath, frontmatter, "utf-8");
  }
  return filepath;
}

// ========== 主流程 ==========

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("🔍 预览模式 — 不会写入文件\n");

  const existing = getExistingUrls();
  console.log(`已收录 ${existing.size} 篇新闻\n`);

  const allItems: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    console.log(`📡 抓取 ${feed.name}...`);
    try {
      const articles = await fetchFeed(feed.url);
      const newArticles = articles
        .filter((a) => !existing.has(a.link))
        .slice(0, MAX_PER_FEED);

      console.log(`  ${articles.length} 篇 → ${newArticles.length} 篇新`);

      for (const article of newArticles) {
        console.log(`  ⏳ 生成: ${article.title.slice(0, 60)}...`);
        try {
          const item = await generateSummary(article);
          if (item) {
            allItems.push(item);
            const fpath = writeNewsFile(item, dryRun);
            console.log(`  ✅ ${fpath}`);
          }
        } catch (e: any) {
          console.error(`  ❌ ${e.message}`);
        }
      }
    } catch (e: any) {
      console.error(`  ❌ ${feed.name}: ${e.message}`);
    }

    if (allItems.length >= MAX_TOTAL) break;
  }

  console.log(`\n📝 共生成 ${allItems.length} 篇新闻${dryRun ? " (预览)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
