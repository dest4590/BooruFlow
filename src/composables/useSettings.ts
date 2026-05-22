import { ref, watch } from "vue";

export type BooruMode = "sfw" | "nsfw";

interface Settings {
  mode: BooruMode;
  recentSearches: string[];
  alwaysLoadHighRes: boolean;
  excludeAi: boolean;
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

watch(
  [mode, recentSearches, alwaysLoadHighRes, excludeAi],
  ([m, r, h, a]) => {
    persistSettings({
      mode: m,
      recentSearches: r,
      alwaysLoadHighRes: h,
      excludeAi: a,
    });
  },
  { deep: true },
);

export { mode, recentSearches, alwaysLoadHighRes, excludeAi };

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

  return {
    mode,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
