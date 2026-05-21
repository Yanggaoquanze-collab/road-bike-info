// scripts/download-bike-images-v2.ts
// 从 Unsplash 下载公路车照片作为车型图片
import { writeFileSync } from "fs";

const BIKE_IMAGES: Record<string, string> = {
  "giant-tcr-advanced-pro-2025": "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80",
  "giant-tcr-advanced-2-2025": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
  "specialized-sworks-sl8-2025": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
  "trek-madone-slr-2025": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80",
  "trek-domane-sl-2025": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&q=80",
  "canyon-aeroad-cfr-2025": "https://images.unsplash.com/photo-1532386233570-b538567a639b?w=800&q=80",
  "cannondale-supersix-evo-2025": "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800&q=80",
  "cervelo-r5-2025": "https://images.unsplash.com/photo-1505843490570-d8c79f22a0ff?w=800&q=80",
  "merida-scultura-9000-2025": "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80",
  "pinarello-dogma-f-2025": "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=800&q=80",
};

async function main() {
  console.log("Downloading bike images from Unsplash...");
  let ok = 0;
  let fail = 0;

  for (const [slug, url] of Object.entries(BIKE_IMAGES)) {
    const outPath = `public/images/bikes/${slug}.jpg`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        console.error(`  FAIL ${slug}: HTTP ${res.status}`);
        fail++;
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buffer);
      console.log(`  OK   ${slug} → ${buffer.length} bytes`);
      ok++;
    } catch (e) {
      console.error(`  FAIL ${slug}: ${e}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} downloaded, ${fail} failed.`);
}

main();
