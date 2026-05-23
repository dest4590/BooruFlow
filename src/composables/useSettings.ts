import { ref, watch } from "vue";

export type BooruMode = "safebooru" | "rule34" | "gelbooru" | "e621";

export const SOURCE_DISPLAY_NAMES: Record<BooruMode, string> = {
  safebooru: "SafeBooru",
  rule34: "Rule34",
  gelbooru: "Gelbooru",
  e621: "e621",
};

export const SOURCE_CATEGORIES: Record<BooruMode, "sfw" | "nsfw"> = {
  safebooru: "sfw",
  rule34: "nsfw",
  gelbooru: "nsfw",
  e621: "nsfw",
};

interface Settings {
  mode: BooruMode;
  recentSearches: string[];
  alwaysLoadHighRes: boolean;
  excludeAi: boolean;
  rule34ApiKey?: string;
  rule34UserId?: string;
  gelbooruApiKey?: string;
  gelbooruUserId?: string;
}

const STORAGE_KEY = "booruflow_settings";
const MAX_RECENT_SEARCHES = 10;

function migrateOldMode(oldMode: unknown): BooruMode {
  if (oldMode === "nsfw") return "rule34";
  if (oldMode === "sfw") return "safebooru";
  const validModes: BooruMode[] = ["safebooru", "rule34", "gelbooru", "e621"];
  if (
    typeof oldMode === "string" &&
    validModes.includes(oldMode as BooruMode)
  ) {
    return oldMode as BooruMode;
  }
  return "safebooru";
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      const next: Settings = {
        mode: migrateOldMode(parsed.mode),
        recentSearches: Array.isArray(parsed.recentSearches)
          ? parsed.recentSearches.slice(0, MAX_RECENT_SEARCHES)
          : [],
        alwaysLoadHighRes: parsed.alwaysLoadHighRes === true,
        excludeAi: parsed.excludeAi !== false,
        rule34ApiKey:
          typeof parsed.rule34ApiKey === "string" ? parsed.rule34ApiKey : "",
        rule34UserId:
          typeof parsed.rule34UserId === "string" ? parsed.rule34UserId : "",
        gelbooruApiKey:
          typeof parsed.gelbooruApiKey === "string"
            ? parsed.gelbooruApiKey
            : "",
        gelbooruUserId:
          typeof parsed.gelbooruUserId === "string"
            ? parsed.gelbooruUserId
            : "",
      };
      persistSettings(next);
      return next;
    }
  } catch {}
  const fallback: Settings = {
    mode: "safebooru",
    recentSearches: [],
    alwaysLoadHighRes: false,
    excludeAi: true,
  };
  persistSettings(fallback);
  return fallback;
}

function persistSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const initial = loadSettings();
const mode = ref<BooruMode>(initial.mode);
const recentSearches = ref<string[]>(initial.recentSearches);
const alwaysLoadHighRes = ref<boolean>(initial.alwaysLoadHighRes);
const excludeAi = ref<boolean>(initial.excludeAi);
const rule34ApiKey = ref<string>(initial.rule34ApiKey ?? "");
const rule34UserId = ref<string>(initial.rule34UserId ?? "");
const gelbooruApiKey = ref<string>(initial.gelbooruApiKey ?? "");
const gelbooruUserId = ref<string>(initial.gelbooruUserId ?? "");

watch(
  [
    mode,
    recentSearches,
    alwaysLoadHighRes,
    excludeAi,
    rule34ApiKey,
    rule34UserId,
    gelbooruApiKey,
    gelbooruUserId,
  ],
  ([m, r, h, a]) => {
    persistSettings({
      mode: m,
      recentSearches: r,
      alwaysLoadHighRes: h,
      excludeAi: a,
      rule34ApiKey: rule34ApiKey.value,
      rule34UserId: rule34UserId.value,
      gelbooruApiKey: gelbooruApiKey.value,
      gelbooruUserId: gelbooruUserId.value,
    });
  },
  { deep: true },
);

export {
  mode,
  recentSearches,
  alwaysLoadHighRes,
  excludeAi,
  rule34ApiKey,
  rule34UserId,
  gelbooruApiKey,
  gelbooruUserId,
};

export function useSettings() {
  function addRecentSearch(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;

    const idx = recentSearches.value.indexOf(trimmed);
    if (idx !== -1) {
      recentSearches.value.splice(idx, 1);
    }

    recentSearches.value.unshift(trimmed);
    if (recentSearches.value.length > MAX_RECENT_SEARCHES) {
      recentSearches.value.pop();
    }
  }

  function clearRecentSearches(): void {
    recentSearches.value = [];
  }

  function setRule34Credentials(apiKey: string, userId: string) {
    rule34ApiKey.value = apiKey.trim();
    rule34UserId.value = userId.trim();
  }

  function setGelbooruCredentials(apiKey: string, userId: string) {
    gelbooruApiKey.value = apiKey.trim();
    gelbooruUserId.value = userId.trim();
  }

  return {
    mode,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    rule34ApiKey,
    rule34UserId,
    gelbooruApiKey,
    gelbooruUserId,
    setRule34Credentials,
    setGelbooruCredentials,
  };
}
