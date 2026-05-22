<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import EmptyState from "./components/EmptyState.vue";
import FiltersModal from "./components/FiltersModal.vue";
import SettingsModal from "./components/SettingsModal.vue";
import ImageGrid from "./components/ImageGrid.vue";
import { useSettings } from "./composables/useSettings";
import { searchPosts } from "./composables/useBooru";
import { useUrlParams } from "./composables/useUrlParams";
import type { BooruPost } from "./composables/useBooru";
import type { Filters } from "./components/FiltersModal.vue";
import { X as CloseIcon } from "@lucide/vue";

const { mode } = useSettings();
const urlParams = useUrlParams();

const query = ref("");
const posts = ref<BooruPost[]>([]);
const showSettings = ref(false);
const currentPage = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);
const showFilters = ref(false);
const hasMore = ref(true);
const hasSearched = ref(false);
const showSidebar = ref(true);
const shareSuccess = ref(false);

const filters = ref<Filters>({
  sort: "default",
  minScore: null,
  rating: "any",
  excludeTags: [],
});

const filtersActive = computed(
  () =>
    filters.value.sort !== "default" ||
    filters.value.minScore !== null ||
    filters.value.rating !== "any" ||
    filters.value.excludeTags.length > 0,
);

const LIMIT = 40;
const queryTags = computed(() =>
  query.value.trim()
    ? query.value
        .trim()
        .split(/\s*,\s*/)
        .filter(Boolean)
    : [],
);

function normalizeQueryForSearch(value: string): string {
  const parts =
    value
      .trim()
      .split(/\s*,\s*/)
      .filter(Boolean) ?? [];

  return parts.join(" ");
}

function buildTagString(base: string): string {
  const parts = base.trim()
    ? base
        .trim()
        .split(/\s*,\s*/)
        .filter(Boolean)
    : [];

  for (const t of filters.value.excludeTags) {
    if (!parts.includes(`-${t}`)) parts.push(`-${t}`);
  }

  if (filters.value.sort === "score") parts.push("sort:score:desc");
  else if (filters.value.sort === "random") parts.push("sort:random");

  if (filters.value.minScore !== null)
    parts.push(`score:>=${filters.value.minScore}`);

  if (filters.value.rating !== "any")
    parts.push(`rating:${filters.value.rating}`);

  return parts.join(" ");
}

async function doSearch(tags: string, append = false) {
  const full = buildTagString(tags);
  if (!full.trim()) return;
  error.value = null;
  loading.value = true;
  hasSearched.value = true;
  try {
    const page = append ? currentPage.value : 0;
    const newPosts = await searchPosts(full, mode.value, page, LIMIT);
    if (append) {
      posts.value.push(...newPosts);
    } else {
      posts.value = newPosts;
      currentPage.value = 0;
    }
    hasMore.value = newPosts.length === LIMIT;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Search failed";
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  currentPage.value = 0;
  await doSearch(normalizeQueryForSearch(query.value));
}

async function onLoadMore() {
  currentPage.value++;
  await doSearch(query.value, true);
}

function applyFilters(f: Filters) {
  filters.value = f;
  if (hasSearched.value) onSearch();
}

function addTag(tag: string) {
  if (!queryTags.value.includes(tag)) {
    query.value = [...queryTags.value, tag].join(", ");
  }
}

function removeTag(tag: string) {
  const nextQuery = queryTags.value.filter((item) => item !== tag);
  if (nextQuery.length !== queryTags.value.length) {
    query.value = nextQuery.join(", ");
    return;
  }

  if (filters.value.excludeTags.includes(tag)) {
    filters.value = {
      ...filters.value,
      excludeTags: filters.value.excludeTags.filter((item) => item !== tag),
    };
  }
}

function excludeTag(tag: string) {
  if (!filters.value.excludeTags.includes(tag)) {
    filters.value = {
      ...filters.value,
      excludeTags: [...filters.value.excludeTags, tag],
    };
  }
}

function searchTag(tag: string) {
  query.value = tag;
  currentPage.value = 0;
  void onSearch();
}

function handleShare() {
  const shareUrl = urlParams.getShareUrl();
  void navigator.clipboard?.writeText(shareUrl);
  shareSuccess.value = true;
  setTimeout(() => {
    shareSuccess.value = false;
  }, 2000);
}

// Load URL params on mount
onMounted(() => {
  const params = urlParams.load();
  if (params.tags?.length) {
    query.value = params.tags.join(", ");
    void onSearch();
  }
  if (params.mode && params.mode !== mode.value) {
    mode.value = params.mode;
  }
});

// Sync query to URL
watch(
  () => query.value,
  () => {
    urlParams.update({ tags: queryTags.value });
  },
);

// Sync mode to URL
watch(
  () => mode.value,
  () => {
    urlParams.update({ mode: mode.value });
  },
);
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-app-bg text-app-text">
    <AppHeader
      :show-sidebar="showSidebar"
      @toggle-sidebar="showSidebar = !showSidebar"
    />

    <AppSidebar
      v-model:query="query"
      v-model:mode="mode"
      :show-sidebar="showSidebar"
      :loading="loading"
      :filters-active="filtersActive"
      @close-sidebar="showSidebar = false"
      @open-filters="showFilters = true"
      @open-settings="showSettings = true"
      @search="onSearch"
      @share="handleShare"
    />

    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <main class="flex-1 overflow-y-auto no-scrollbar px-4 py-12 md:py-6">
        <EmptyState
          :has-searched="hasSearched"
          :loading="loading"
          :error="error"
          :post-count="posts.length"
        />

        <template v-if="hasSearched">
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
          >
            <div
              v-if="error"
              class="mb-8 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-4 bg-app-bg-2 border border-red-500/20 text-red-400 shadow-xl shadow-red-500/5 transition-all"
            >
              <div
                class="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"
              >
                <CloseIcon class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <p
                  class="text-[10px] uppercase tracking-widest opacity-60 mb-0.5"
                >
                  Search error
                </p>
                {{ error }}
              </div>
            </div>
          </Transition>

          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <div
              v-if="shareSuccess"
              class="mb-8 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-4 bg-app-bg-2 border border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-500/5 transition-all"
            >
              <div
                class="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"
              >
                ✓
              </div>
              <div class="flex-1">
                <p
                  class="text-[10px] uppercase tracking-widest opacity-60 mb-0.5"
                >
                  Copied!
                </p>
                Share link copied to clipboard
              </div>
            </div>
          </Transition>

          <ImageGrid
            :posts="posts"
            :loading="loading"
            :has-more="hasMore"
            :mode="mode"
            :query-tags="queryTags"
            :exclude-tags="filters.excludeTags"
            @load-more="onLoadMore"
            @add-tag="addTag"
            @remove-tag="removeTag"
            @exclude-tag="excludeTag"
            @search-tag="searchTag"
          />

          <div v-if="loading && posts.length" class="flex justify-center p-8">
            <div
              class="w-8 h-8 border-2 border-(--c-text-3) border-t-(--c-text) rounded-full animate-spin"
            ></div>
          </div>
        </template>
      </main>
    </div>

    <FiltersModal
      v-if="showFilters"
      :filters="filters"
      :mode="mode"
      @update="applyFilters"
      @close="showFilters = false"
    />

    <SettingsModal
      v-if="showSettings"
      :open="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
