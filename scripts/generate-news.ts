/**
 * 公路车新闻自动生成脚本（增强版）
 *
 * 工作流程（五阶段）：
 *   阶段一：从 6 个 RSS 源（3 英文 + 3 中文）并行抓取文章
 *   阶段二：跨源交叉验证 — 标题相似度 + 链接匹配
 *   阶段三：按可信度排序、去重、限制数量
 *   阶段四：调用 Claude Haiku API 生成中文摘要
 *   阶段五：写入 MDX 文件（全部 draft: true，含验证元数据）
 *
 * 环境变量：
 *   ANTHROPIC_API_KEY — Claude API 密钥（必需）
 *
 * 用法：
 *   npx tsx scripts/generate-news.ts           # 正常运行
 *   npx tsx scripts/generate-news.ts --dry-run # 预览模式，不写入文件
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ========== 配置 ==========

/** RSS 订阅源列表 */
const RSS_FEEDS = [
  // 英文源
  { name: "CyclingNews", url: "https://www.cyclingnews.com/rss/", lang: "en" },
  { name: "VeloNews", url: "https://velo.outsideonline.com/feed/", lang: "en" },
  { name: "BikeRadar", url: "https://www.bikeradar.com/feed", lang: "en" },
  // 中文源
  { name: "美骑网", url: "https://www.biketo.com/rss", lang: "zh" },
  { name: "骑行家", url: "https://www.cyclingchina.net/feed", lang: "zh" },
  { name: "野途网", url: "https://www.wildto.com/feed", lang: "zh" },
];

/** 每个 RSS 源最多取用文章数 */
const MAX_PER_FEED = 2;
/** 单次运行最多生成新闻总数 */
const MAX_TOTAL = 5;
/** 自动生成内容的输出目录 */
const CONTENT_DIR = "src/content/news/_auto";
/** 使用的 Claude 模型 */
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

/** Claude 系统提示词 */
const SYSTEM_PROMPT = `你是一个专业的公路车资讯编辑。请用中文撰写一条简洁的公路车新闻摘要。

要求：
- 100-150 字
- 包含关键事实（谁、什么、何时）
- 语气专业但平易近人
- 标题使用中文
- 标签 1-3 个（中文）
- 如果新闻内容涉及转会传闻、未发布产品、赛事争议，请在摘要中体现"尚未官方确认"等谨慎措辞
- 直接输出 JSON 格式，不要 markdown 代码块

输出格式：
{
  "title": "中文新闻标题",
  "summary": "100-150字中文摘要",
  "tags": ["标签1", "标签2"]
}`;

// ========== 类型定义 ==========

/** RSS 原始文章 */
interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  source: string;
}

/** 经交叉验证的文章 */
interface ValidatedArticle extends RawArticle {
  matches: string[];
  confidence: "high" | "medium" | "low";
  verified: boolean;
  crossSources: string[];
}

/** 最终生成的新闻条目 */
interface NewsItem {
  title: string;
  summary: string;
  tags: string[];
  sourceUrl: string;
  date: string;
  verified: boolean;
  crossSources: string[];
  confidence: "high" | "medium" | "low";
}

// ========== 工具函数 ==========

/** 计算两个标题之间的词汇重叠度（0-1） */
function titleSimilarity(a: string, b: string): number {
  const tokensA = a
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const tokensB = b
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const intersection = tokensA.filter((t) => tokensB.includes(t));
  return intersection.length / Math.max(tokensA.length, tokensB.length);
}

/** 解码 XML 实体和 CDATA */
function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");
}

/** 去除 HTML 标签 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** 从 XML 片段中提取标签内容 */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

/** 从条目中提取链接（兼容 RSS <link> 和 Atom <link href="">） */
function extractLink(entry: string): string {
  // Atom 格式：<link href="..." />
  const atomMatch = entry.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i
  );
  if (atomMatch) return decodeXml(atomMatch[1]);
  // RSS 格式：<link>...</link>
  return decodeXml(extractTag(entry, "link"));
}

/** 从条目中提取发布日期（兼容 RSS pubDate 和 Atom published/updated） */
function extractDate(entry: string): string {
  return (
    extractTag(entry, "published") ||
    extractTag(entry, "updated") ||
    extractTag(entry, "pubDate") ||
    new Date().toISOString()
  );
}

// ========== 阶段一：RSS 抓取 ==========

/** 抓取单个 RSS 源，返回解析后的文章列表 */
async function fetchFeed(
  feedUrl: string,
  sourceName: string
): Promise<RawArticle[]> {
  const resp = await fetch(feedUrl, {
    headers: { "User-Agent": "RoadBikeInfo/1.0" },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} — ${feedUrl}`);
  }

  const text = await resp.text();
  const articles = extractArticles(text, sourceName);

  if (articles.length === 0) {
    throw new Error(`未能解析任何文章，可能是未知的 XML 格式`);
  }

  return articles;
}

/** 从 XML 文本中提取文章列表（兼容 RSS 2.0 和 Atom） */
function extractArticles(xml: string, sourceName: string): RawArticle[] {
  const items: RawArticle[] = [];

  // 先尝试 RSS 2.0 <item> 格式
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractLink(item);
    const pubDate = extractDate(item);
    const desc = extractTag(item, "description");

    if (title && link) {
      items.push({
        title: decodeXml(title),
        link,
        pubDate: decodeXml(pubDate),
        contentSnippet: desc
          ? stripHtml(decodeXml(desc)).slice(0, 500)
          : undefined,
        source: sourceName,
      });
    }
  }

  // 如果没有 <item>，尝试 Atom <entry> 格式
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = extractTag(entry, "title");
      const link = extractLink(entry);
      const pubDate = extractDate(entry);
      const desc =
        extractTag(entry, "summary") || extractTag(entry, "content");

      if (title && link) {
        items.push({
          title: decodeXml(title),
          link,
          pubDate: decodeXml(pubDate),
          contentSnippet: desc
            ? stripHtml(decodeXml(desc)).slice(0, 500)
            : undefined,
          source: sourceName,
        });
      }
    }
  }

  return items;
}

// ========== 阶段二：交叉验证 ==========

/**
 * 跨源交叉验证所有文章
 *
 * 对每篇文章，在所有不同来源的文章中查找匹配：
 *   - 如果另一篇文章的链接相同，视为同一新闻
 *   - 如果标题 token 重叠度 >= threshold，视为同一新闻
 *
 * 可信度判定：
 *   - 匹配 2 个以上其他来源 → high（已核实）
 *   - 匹配 1 个其他来源 → medium（双源验证）
 *   - 无匹配 → low（待核实）
 */
function crossValidate(
  articles: RawArticle[],
  threshold: number = 0.6
): ValidatedArticle[] {
  return articles.map((article) => {
    const matches: string[] = [];

    for (const other of articles) {
      // 只比较不同来源的文章
      if (article.source === other.source) continue;

      const similarity = titleSimilarity(article.title, other.title);
      if (similarity >= threshold || article.link === other.link) {
        if (!matches.includes(other.source)) {
          matches.push(other.source);
        }
      }
    }

    // 根据匹配来源数确定可信度
    let confidence: "high" | "medium" | "low";
    let verified: boolean;

    if (matches.length >= 2) {
      confidence = "high";
      verified = true;
    } else if (matches.length === 1) {
      confidence = "medium";
      verified = true;
    } else {
      confidence = "low";
      verified = false;
    }

    return {
      ...article,
      matches,
      confidence,
      verified,
      crossSources: [article.source, ...matches],
    };
  });
}

// ========== 去重 ==========

/** 读取已有文章的 sourceUrl 集合，用于去重 */
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

// ========== 阶段四：Claude API 摘要生成 ==========

/** 调用 Claude API 生成中文摘要 */
async function generateSummary(
  article: ValidatedArticle
): Promise<NewsItem | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 环境变量未设置");
  }

  const userContent = `标题：${article.title}
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
      summary: parsed.summary || "",
      tags: parsed.tags || [],
      sourceUrl: article.link,
      date: new Date(article.pubDate).toISOString().slice(0, 10),
      verified: article.verified,
      crossSources: article.crossSources,
      confidence: article.confidence,
    };
  } catch {
    console.error("  Claude 返回内容解析失败:", text.slice(0, 200));
    return null;
  }
}

// ========== 阶段五：文件写入 ==========

/** 根据可信度生成标题前缀 */
function confidencePrefix(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "[已核实]";
    case "medium":
      return "[双源验证]";
    case "low":
      return "[待核实]";
  }
}

/** 根据可信度生成验证提示语 */
function verifiedMessage(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "经 3 个以上来源交叉验证";
    case "medium":
      return "经 2 个来源交叉验证";
    case "low":
      return "⚠️ 本条仅有单一信源，建议人工核实后再发布。确认后可删除本提示，将 draft 改为 false";
  }
}

/** 将新闻条目写入 MDX 文件 */
function writeNewsFile(item: NewsItem, dryRun: boolean): string {
  const date = item.date;
  const prefix = confidencePrefix(item.confidence);
  const displayTitle = `${prefix} ${item.title}`;

  const slug =
    item.title
      .replace(/[^\w一-鿿]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .toLowerCase() || "untitled";

  const filename = `${date}-${slug}.md`;
  const filepath = path.resolve(CONTENT_DIR, filename);

  const verifiedMsg = verifiedMessage(item.confidence);

  // 构建 YAML frontmatter 和 MDX 正文
  const content = [
    "---",
    `title: "${displayTitle}"`,
    `date: ${date}`,
    `author: "AI"`,
    `source: "RSS"`,
    `sourceUrl: "${item.sourceUrl}"`,
    item.tags.length > 0
      ? `tags: [${item.tags.map((t) => `"${t}"`).join(", ")}]`
      : "tags: []",
    `summary: "${item.summary.replace(/"/g, '\\"')}"`,
    "draft: true",
    "autoGenerated: true",
    `verified: ${item.verified}`,
    `crossSources: [${item.crossSources.map((s) => `"${s}"`).join(", ")}]`,
    `confidence: "${item.confidence}"`,
    "---",
    "",
    `> 🤖 本条由 AI 自动生成。${verifiedMsg}，请审核后发布。`,
    "",
    item.summary,
    "",
  ].join("\n");

  if (!dryRun) {
    fs.mkdirSync(path.resolve(CONTENT_DIR), { recursive: true });
    fs.writeFileSync(filepath, content, "utf-8");
  }

  return filepath;
}

// ========== 主流程 ==========

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("🔍 预览模式 — 不会写入文件\n");
  }

  console.log("╔══════════════════════════════════╗");
  console.log("║  公路车新闻自动生成器（增强版）  ║");
  console.log("╚══════════════════════════════════╝\n");

  // ===== 阶段一：抓取所有 RSS 文章 =====
  console.log("📡 阶段一：抓取 RSS 源...\n");

  const allArticles: RawArticle[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const articles = await fetchFeed(feed.url, feed.name);
      const limited = articles.slice(0, MAX_PER_FEED);
      allArticles.push(...limited);
      console.log(
        `  ✅ ${feed.name}: ${articles.length} 篇 → 取 ${limited.length} 篇`
      );
    } catch (e: any) {
      console.error(`  ⚠️ 跳过 ${feed.name}: ${e.message}`);
      // 中文源失败不中断整个流程
    }
  }

  if (allArticles.length === 0) {
    console.log("\n⚠️ 未能从任何 RSS 源获取文章，退出。");
    return;
  }

  console.log(`\n  共抓取 ${allArticles.length} 篇文章\n`);

  // ===== 阶段二：交叉验证 =====
  console.log("🔗 阶段二：跨源交叉验证...\n");

  const validated = crossValidate(allArticles);

  const counts = { high: 0, medium: 0, low: 0 };
  for (const v of validated) {
    counts[v.confidence]++;
  }
  console.log(
    `  高可信度: ${counts.high} | 中可信度: ${counts.medium} | 低可信度: ${counts.low}\n`
  );

  // ===== 阶段三：排序与筛选 =====
  console.log("📊 阶段三：排序与筛选...\n");

  const existing = getExistingUrls();
  console.log(`  已收录 ${existing.size} 篇（按 sourceUrl 去重）\n`);

  const confOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

  const candidates = validated
    .filter((a) => !existing.has(a.link))
    .sort((a, b) => {
      // 先按可信度排序（高 → 低）
      const diff = confOrder[b.confidence] - confOrder[a.confidence];
      if (diff !== 0) return diff;
      // 再按日期排序（新 → 旧）
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    })
    .slice(0, MAX_TOTAL);

  console.log(
    `  去重后 ${candidates.length} 篇待生成（上限 ${MAX_TOTAL}）\n`
  );

  if (candidates.length === 0) {
    console.log("✅ 没有新文章需要生成。");
    return;
  }

  // ===== 阶段四：生成摘要 =====
  console.log("🤖 阶段四：调用 Claude API 生成摘要...\n");

  const items: NewsItem[] = [];

  for (const article of candidates) {
    const sourceLabel =
      article.crossSources.length > 1
        ? `${article.source} +${article.crossSources.length - 1}`
        : article.source;
    console.log(
      `  ⏳ [${article.confidence}] ${sourceLabel}: ${article.title.slice(0, 60)}...`
    );

    try {
      const item = await generateSummary(article);
      if (item) {
        items.push(item);
        console.log(`  ✅ 生成成功: ${item.title}`);
      } else {
        console.log(`  ⚠️ 解析失败，跳过`);
      }
    } catch (e: any) {
      console.error(`  ❌ API 错误: ${e.message}`);
    }
  }

  console.log(`\n  成功生成 ${items.length}/${candidates.length} 篇摘要\n`);

  // ===== 阶段五：写入文件 =====
  console.log("💾 阶段五：写入 MDX 文件...\n");

  for (const item of items) {
    const fpath = writeNewsFile(item, dryRun);
    const status = dryRun ? "🔍" : "📄";
    console.log(
      `  ${status} [${item.confidence}] ${path.basename(fpath)}`
    );
  }

  // ===== 汇总报告 =====
  console.log("\n╔══════════════════════════════════╗");
  console.log("║           汇总报告               ║");
  console.log("╚══════════════════════════════════╝");
  console.log(`  抓取文章: ${allArticles.length} 篇`);
  console.log(`  去重/筛选后: ${items.length} 篇`);
  console.log(
    `  高可信度 (3+ 源): ${items.filter((i) => i.confidence === "high").length}`
  );
  console.log(
    `  中可信度 (2 源):  ${items.filter((i) => i.confidence === "medium").length}`
  );
  console.log(
    `  低可信度 (1 源):  ${items.filter((i) => i.confidence === "low").length}`
  );
  console.log(`  模式: ${dryRun ? "预览 (dry-run)" : "正式写入"}`);
  console.log("");
}

main().catch((e) => {
  console.error("❌ 脚本执行失败:", e);
  process.exit(1);
});
