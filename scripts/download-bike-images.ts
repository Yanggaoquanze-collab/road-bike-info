/**
 * 车型产品图下载脚本
 *
 * 使用方法：
 * 1. 在 IMAGE_URLS 数组中填入每款车的官方图片直链
 * 2. 运行: npx tsx scripts/download-bike-images.ts
 *
 * 获取官方图片直链的方法：
 * - 访问制造商官网产品页，打开浏览器开发者工具 (F12)
 * - 在 Network 标签页中筛选 Img，找到高分辨率产品图
 * - 常见 CDN 模式：
 *   Giant:     https://static.giant-bicycles.com/...
 *   Trek:      https://trek.scene7.com/...
 *   Specialized: https://assets.specialized.com/...
 *   Canyon:    https://www.canyon.com/dw/image/...
 *   Cannondale: https://www.cannondale.com/...
 */

const IMAGE_URLS: Record<string, string> = {
  "giant-tcr-advanced-pro-2025": "",
  "giant-tcr-advanced-2-2025": "",
  "specialized-sworks-tarmac-sl8-2025": "",
  "trek-madone-slr-2025": "",
  "trek-domane-sl-2025": "",
  "canyon-aeroad-cfr-2025": "",
  "cannondale-supersix-evo-2025": "",
  "merida-scultura-9000-2025": "",
  "pinarello-dogma-f-2025": "",
  "cervelo-r5-2025": "",
};

const OUTPUT_DIR = "public/images/bikes";

async function download() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  for (const [slug, url] of Object.entries(IMAGE_URLS)) {
    if (!url) {
      console.log(`跳过 ${slug}: 未配置图片 URL`);
      continue;
    }
    console.log(`下载 ${slug}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ext = url.split(".").pop()?.split("?")[0] || "jpg";
      const dest = path.join(OUTPUT_DIR, `${slug}.${ext}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`  -> ${dest}`);
    } catch (e: any) {
      console.error(`  ✗ ${slug}: ${e.message}`);
    }
  }
  console.log("完成");
}

download();
