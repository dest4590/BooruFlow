import type { BooruMode } from "./useSettings";
import {
  excludeAi,
  rule34ApiKey,
  rule34UserId,
  gelbooruApiKey,
  gelbooruUserId,
} from "./useSettings";

export interface BooruPost {
  id: number;
  file_url: string;
  preview_url?: string;
  tags: string;
  rating: "safe" | "general" | "explicit" | "questionable";
  score: number;
  source?: string;
  width?: number;
  height?: number;

  tag_info?: Record<string, { type: number }>;
}

export type MediaType = "image" | "video" | "gif";

export function getMediaType(fileUrl: string): MediaType {
  const url = fileUrl.toLowerCase();
  const videoExtensions = [".webm", ".mp4", ".mov", ".avi"];
  const gifExtensions = [".gif"];

  for (const ext of videoExtensions) {
    if (url.includes(ext)) return "video";
  }

  for (const ext of gifExtensions) {
    if (url.includes(ext)) return "gif";
  }

  return "image";
}

export function isAnimatedMedia(fileUrl: string): boolean {
  const type = getMediaType(fileUrl);
  return type === "video" || type === "gif";
}

export interface AutocompleteItem {
  value: string;
  label: string;
  post_count: number;
  type?: number;
}

export type TagCategory =
  | "artist"
  | "character"
  | "series"
  | "general"
  | "copyright"
  | "other";

export interface TagWithCategory {
  value: string;
  label: string;
  category: TagCategory;
  post_count: number;
}

export const TAG_TYPE_MAP: Record<number, TagCategory> = {
  0: "general",
  1: "artist",
  2: "character",
  3: "series",
  4: "copyright",
  5: "other",
};

export const CATEGORY_COLORS: Record<TagCategory, { text: string }> = {
  artist: { text: "#d8b4fe" },
  character: { text: "#93c5fd" },
  series: { text: "#86efac" },
  copyright: { text: "#fed7aa" },
  general: { text: "#a1a1aa" },
  other: { text: "#71717a" },
};

const ENDPOINTS: Record<
  BooruMode,
  { posts: string; autocomplete: string; tags?: string }
> = {
  safebooru: {
    posts: "https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1",
    autocomplete: "https://safebooru.org/autocomplete.php",
    tags: "https://safebooru.org/index.php?page=dapi&s=tag&q=index&json=1",
  },
  rule34: {
    posts: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1",
    autocomplete: "https://api.rule34.xxx/autocomplete.php",
    tags: "https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&json=1",
  },
  gelbooru: {
    posts: "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1",
    autocomplete: "https://gelbooru.com/autocomplete.php",
    tags: "https://gelbooru.com/index.php?page=dapi&s=tag&q=index&json=1",
  },
  e621: {
    posts: "https://e621.net/posts.json",
    autocomplete: "https://e621.net/autocomplete.json?search[type]=tag_query",
    tags: "https://e621.net/tags.json",
  },
} as const;

const CORS_PROXY = "https://corsproxy.io/?";

function getRule34Key() {
  return rule34ApiKey.value?.trim() ?? "";
}

function getRule34UserId() {
  return rule34UserId.value?.trim() ?? "";
}

function getGelbooruKey() {
  return gelbooruApiKey.value?.trim() ?? "";
}

function getGelbooruUserId() {
  return gelbooruUserId.value?.trim() ?? "";
}

async function fetchWithCors(url: string): Promise<Response> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return res;
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    return res;
  }
}

async function safeJsonParse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function requiresAuth(mode: BooruMode): boolean {
  return mode === "rule34" || mode === "gelbooru";
}

function isE621Format(mode: BooruMode): boolean {
  return mode === "e621";
}

function isDanbooruFormat(mode: BooruMode): boolean {
  return mode === "safebooru" || mode === "rule34" || mode === "gelbooru";
}

function normalizePost(post: any, mode: BooruMode): BooruPost {
  if (isE621Format(mode)) {
    return {
      id: post.id,
      file_url: post.file?.url || post.file?.https?.url || "",
      preview_url:
        post.preview?.url ||
        post.preview?.https?.url ||
        post.file?.url ||
        post.file?.https?.url,
      tags: Object.keys(post.tags || {}).join(" "),
      rating: (post.rating || "safe") as any,
      score: post.score?.total || 0,
      source: post.sources?.join(", "),
      width: post.file?.width,
      height: post.file?.height,
    };
  } else {
    return {
      id: post.id,
      file_url: post.file_url,
      preview_url: post.preview_url ?? post.file_url,
      tags: post.tags,
      rating: post.rating,
      score: post.score ?? 0,
      source: post.source,
      width: post.width,
      height: post.height,
      tag_info: post.tag_info,
    };
  }
}

export async function searchPosts(
  tags: string,
  mode: BooruMode,
  page = 0,
  limit = 40,
): Promise<BooruPost[]> {
  const normalizedTags = tags
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" ");

  let finalTags = normalizedTags;
  if (excludeAi.value) {
    const aiTags = "-ai_generated -ai-generated";
    finalTags = finalTags ? `${finalTags} ${aiTags}` : aiTags;
  }

  let url: string;

  if (isE621Format(mode)) {
    const searchParams = new URLSearchParams();
    searchParams.set("tags", finalTags);
    searchParams.set("limit", limit.toString());
    searchParams.set("page", (page + 1).toString());
    url = `${ENDPOINTS[mode].posts}?${searchParams.toString()}`;
  } else if (isDanbooruFormat(mode)) {
    let baseUrl = `${ENDPOINTS[mode].posts}&tags=${encodeURIComponent(finalTags)}&limit=${limit}&pid=${page}`;
    if (mode === "rule34") {
      baseUrl += "&fields=tag_info";
    }
    url = baseUrl;
  } else {
    throw new Error(`Unknown booru mode: ${mode}`);
  }

  if (requiresAuth(mode)) {
    const apiKey = mode === "gelbooru" ? getGelbooruKey() : getRule34Key();
    const userId =
      mode === "gelbooru" ? getGelbooruUserId() : getRule34UserId();
    if (apiKey && userId) {
      const urlObj = new URL(url);
      urlObj.searchParams.set("api_key", apiKey);
      urlObj.searchParams.set("user_id", userId);
      url = urlObj.toString();
    } else {
      return [];
    }
  }

  const res = await fetchWithCors(url);
  const data = await safeJsonParse<unknown>(res);

  if (isE621Format(mode)) {
    const e621Data = data as { posts?: any[] };
    if (!Array.isArray(e621Data?.posts)) return [];
    return e621Data.posts.map((post) => normalizePost(post, mode));
  } else {
    if (!Array.isArray(data)) return [];
    return (data as any[]).map((post) => normalizePost(post, mode));
  }
}

export async function autocomplete(
  query: string,
  mode: BooruMode,
): Promise<AutocompleteItem[]> {
  if (!query.trim()) return [];

  let url: string;

  if (isE621Format(mode)) {
    const searchParams = new URLSearchParams();
    searchParams.set("search[query]", query);
    searchParams.set("search[type]", "tag_query");
    url = `${ENDPOINTS[mode].autocomplete}&${searchParams.toString()}`;
  } else if (isDanbooruFormat(mode)) {
    url = `${ENDPOINTS[mode].autocomplete}?q=${encodeURIComponent(query)}`;
  } else {
    throw new Error(`Unknown booru mode: ${mode}`);
  }

  if (requiresAuth(mode)) {
    const apiKey = mode === "gelbooru" ? getGelbooruKey() : getRule34Key();
    const userId =
      mode === "gelbooru" ? getGelbooruUserId() : getRule34UserId();
    if (apiKey && userId) {
      const urlObj = new URL(url);
      urlObj.searchParams.set("api_key", apiKey);
      urlObj.searchParams.set("user_id", userId);
      url = urlObj.toString();
    } else {
      return [];
    }
  }

  try {
    const res = await fetchWithCors(url);
    const data = await safeJsonParse<unknown>(res);

    if (isE621Format(mode)) {
      const e621Data = data as {
        tags?: Array<{ name: string; post_count?: number }>;
      };
      if (!Array.isArray(e621Data?.tags)) return [];
      return e621Data.tags.map((tag) => ({
        value: tag.name,
        label: tag.name.replace(/_/g, " "),
        post_count: tag.post_count ?? 0,
      }));
    } else {
      if (!Array.isArray(data)) return [];
      return (
        data as Array<{ label?: string; value?: string; post_count?: number }>
      ).map((item) => ({
        value: item.value ?? item.label ?? "",
        label: (item.label ?? item.value ?? "").replace(/_/g, " "),
        post_count: item.post_count ?? 0,
      }));
    }
  } catch {
    return [];
  }
}

export function categorizePostTags(
  post: BooruPost,
): Map<string, TagWithCategory> {
  const result = new Map<string, TagWithCategory>();
  const tagList = post.tags.split(/\s+/).filter(Boolean);

  for (const tag of tagList) {
    let category: TagCategory = "general";

    if (post.tag_info?.[tag]?.type !== undefined) {
      category = TAG_TYPE_MAP[post.tag_info[tag].type] ?? "general";
    } else {
      if (
        tag.match(
          /artist|author|creator|drawn_by|by_|name_\(artist\)|_\(artist\)|_\(creator\)/i,
        ) ||
        tag.match(/^[a-z0-9_]+_artist$|^artist_/i)
      ) {
        category = "artist";
      } else if (
        tag.match(
          /character|chan$|kun$|-chan$|-kun$|_\(character\)|\(character\)/i,
        ) ||
        tag.match(/^[a-z0-9_]+_\(character\)/i)
      ) {
        category = "character";
      } else if (
        tag.match(/series|franchise|game|anime|manga|_\(series\)|\(series\)/i)
      ) {
        category = "series";
      } else if (
        tag.match(/copyright|brand|company|_\(copyright\)|\(copyright\)/i)
      ) {
        category = "copyright";
      }
    }

    result.set(tag, {
      value: tag,
      label: tag.replace(/_/g, " "),
      category,
      post_count: 0,
    });
  }

  return result;
}

export async function fetchTagMetadata(
  tags: string[],
): Promise<Map<string, TagWithCategory>> {
  const result = new Map<string, TagWithCategory>();
  for (const tag of tags) {
    result.set(tag, {
      value: tag,
      label: tag.replace(/_/g, " "),
      category: "general",
      post_count: 0,
    });
  }
  return result;
}
