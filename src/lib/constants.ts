export function slugify(id: string) {
  return id.replace(/\.mdx?$/i, "");
}

export const EVENT_LEVELS = {
  "WorldTour-International": { label: "世巡赛·国际", color: "amber", order: 1 },
  "WorldTour-Domestic": { label: "世巡赛·国内", color: "amber", order: 2 },
  Continental: { label: "洲际赛", color: "blue", order: 3 },
  Amateur: { label: "业余赛", color: "green", order: 4 },
} as const;

export const EVENT_TYPES = {
  "stage-race": "多日赛",
  "one-day": "单日赛",
  "gran-fondo": "格兰芬多",
  criterium: "绕圈赛",
} as const;

export const BIKE_CATEGORIES = {
  aero: "气动车",
  "all-rounder": "综合车",
  climbing: "爬坡车",
  endurance: "耐力车",
  gravel: "砾石车",
} as const;

export const PRICE_RANGES = {
  entry: { label: "入门 (＜2万)", min: 0, max: 20000 },
  mid: { label: "中端 (2-5万)", min: 20000, max: 50000 },
  high: { label: "高端 (＞5万)", min: 50000, max: Infinity },
} as const;

export const MAINTENANCE_CATEGORIES = {
  "传动系统": "传动系统",
  "制动系统": "制动系统",
  "轮组": "轮组",
  "车架": "车架",
  "变速": "变速",
  "其他": "其他",
} as const;

export const DIFFICULTY = {
  easy: { label: "简单", color: "green" },
  medium: { label: "中等", color: "amber" },
  hard: { label: "较难", color: "red" },
} as const;
