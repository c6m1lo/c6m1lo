import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.c6m1lo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/resume", "/support", "/privacy", "/tos"];
  const appRoutes = projects
    .map((project) => project.href)
    .filter((href) => href.startsWith("/"));

  const routes = Array.from(new Set([...staticRoutes, ...appRoutes]));

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}
