import { ref, computed } from "vue";
import type { BooruMode } from "./useSettings";

export interface UrlParams {
  tags?: string[];
  mode?: BooruMode;
  excludeAi?: boolean;
  alwaysLoadHighRes?: boolean;
}

function migrateUrlMode(mode: string | null): BooruMode | undefined {
  if (!mode) return undefined;
  if (mode === "nsfw") return "rule34";
  if (mode === "sfw") return "safebooru";
  const validModes: BooruMode[] = ["safebooru", "rule34", "gelbooru", "e621"];
  if (validModes.includes(mode as BooruMode)) {
    return mode as BooruMode;
  }
  return undefined;
}

export function useUrlParams() {
  const currentParams = ref<UrlParams>({});

  function parseUrl(): UrlParams {
    const params = new URLSearchParams(window.location.search);
    const result: UrlParams = {};

    const tagsParam = params.get("tags");
    if (tagsParam) {
      result.tags = tagsParam.split(",").filter(Boolean);
    }

    const mode = migrateUrlMode(params.get("mode"));
    if (mode) {
      result.mode = mode;
    }

    if (params.has("excludeAi")) {
      result.excludeAi = params.get("excludeAi") === "true";
    }

    if (params.has("alwaysLoadHighRes")) {
      result.alwaysLoadHighRes = params.get("alwaysLoadHighRes") === "true";
    }

    return result;
  }

  function serializeToUrl(params: UrlParams) {
    const searchParams = new URLSearchParams();

    if (params.tags?.length) {
      searchParams.set("tags", params.tags.join(","));
    }

    if (params.mode) {
      searchParams.set("mode", params.mode);
    }

    if (params.excludeAi !== undefined) {
      searchParams.set("excludeAi", String(params.excludeAi));
    }

    if (params.alwaysLoadHighRes !== undefined) {
      searchParams.set("alwaysLoadHighRes", String(params.alwaysLoadHighRes));
    }

    const queryString = searchParams.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }

  function load(): UrlParams {
    const params = parseUrl();
    currentParams.value = params;
    return params;
  }

  function update(params: Partial<UrlParams>) {
    currentParams.value = { ...currentParams.value, ...params };
    serializeToUrl(currentParams.value);
  }

  function getShareUrl(): string {
    const base = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    const searchParams = new URLSearchParams();

    if (currentParams.value.tags?.length) {
      searchParams.set("tags", currentParams.value.tags.join(","));
    }

    if (currentParams.value.mode) {
      searchParams.set("mode", currentParams.value.mode);
    }

    if (currentParams.value.excludeAi !== undefined) {
      searchParams.set("excludeAi", String(currentParams.value.excludeAi));
    }

    if (currentParams.value.alwaysLoadHighRes !== undefined) {
      searchParams.set(
        "alwaysLoadHighRes",
        String(currentParams.value.alwaysLoadHighRes),
      );
    }

    const query = searchParams.toString();
    return query ? `${base}?${query}` : base;
  }

  return {
    currentParams: computed(() => currentParams.value),
    load,
    update,
    getShareUrl,
    parseUrl,
    serializeToUrl,
  };
}
