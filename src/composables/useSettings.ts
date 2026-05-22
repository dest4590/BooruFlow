import { ref, watch } from "vue";

export type BooruMode = "sfw" | "nsfw";

interface Settings {
  mode: BooruMode;
  recentSearches: string[];
  alwaysLoadHighRes: boolean;
  excludeAi: boolean;
  rule34ApiKey?: string;
  rule34UserId?: string;
}

const STORAGE_KEY = "booruflow_settings";
const MAX_RECENT_SEARCHES = 10;

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      const next: Settings = {
        mode: parsed.mode === "nsfw" ? "nsfw" : "sfw",
        recentSearches: Array.isArray(parsed.recentSearches)
          ? parsed.recentSearches.slice(0, MAX_RECENT_SEARCHES)
          : [],
        alwaysLoadHighRes: parsed.alwaysLoadHighRes === true,
        excludeAi: parsed.excludeAi !== false,
        rule34ApiKey: typeof parsed.rule34ApiKey === "string" ? parsed.rule34ApiKey : "",
        rule34UserId: typeof parsed.rule34UserId === "string" ? parsed.rule34UserId : "",
      };
      persistSettings(next);
      return next;
    }
  } catch {}
  const fallback: Settings = {
    mode: "sfw",
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

watch(
  [mode, recentSearches, alwaysLoadHighRes, excludeAi, rule34ApiKey, rule34UserId],
  ([m, r, h, a]) => {
    persistSettings({
      mode: m,
      recentSearches: r,
      alwaysLoadHighRes: h,
      excludeAi: a,
      rule34ApiKey: rule34ApiKey.value,
      rule34UserId: rule34UserId.value,
    });
  },
  { deep: true },
);

export { mode, recentSearches, alwaysLoadHighRes, excludeAi, rule34ApiKey, rule34UserId };

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

  return {
    mode,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    rule34ApiKey,
    rule34UserId,
    setRule34Credentials,
  };
}
