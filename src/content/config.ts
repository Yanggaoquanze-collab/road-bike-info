import { defineCollection, z } from "astro:content";

const newsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.enum(["manual", "AI"]).default("manual"),
    source: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const eventsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    level: z.enum(["WorldTour-International", "WorldTour-Domestic", "Continental", "Amateur"]),
    type: z.enum(["stage-race", "one-day", "gran-fondo", "criterium"]),
    region: z.enum(["domestic", "international"]),
    country: z.string(),
    province: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    location: z.string(),
    routeMap: z.string().optional(),
    registrationUrl: z.string().url().optional(),
    resultsUrl: z.string().url().optional(),
    status: z.enum(["upcoming", "ongoing", "completed"]),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const maintenanceCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.enum(["传动系统", "制动系统", "轮组", "车架", "变速", "其他"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    symptoms: z.array(z.string()),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const bikesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    brand: z.string(),
    model: z.string(),
    year: z.number(),
    category: z.enum(["aero", "all-rounder", "climbing", "endurance", "gravel"]),
    price: z.number(),
    priceRange: z.enum(["entry", "mid", "high"]),
    frame: z.string(),
    fork: z.string().optional(),
    groupset: z.string(),
    groupsetType: z.enum(["mechanical", "electronic"]),
    brakes: z.string(),
    wheels: z.string(),
    tires: z.string().optional(),
    weight: z.number(),
    sizes: z.array(z.string()),
    image: z.string(),
    imageAttribution: z.string().optional(),
    officialUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  news: newsCollection,
  events: eventsCollection,
  maintenance: maintenanceCollection,
  bikes: bikesCollection,
};
