<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { BooruMode } from "../composables/useSettings";
import type { BooruPost } from "../composables/useBooru";
import {
  categorizePostTags,
  type TagWithCategory,
  type TagCategory,
  CATEGORY_COLORS,
  getMediaType,
} from "../composables/useBooru";
import { useImageControls } from "../composables/useImageControls";
import BaseTag from "./BaseTag.vue";
import ImageControls from "./ImageControls.vue";
import {
  X,
  Loader2,
  Tag,
  Download,
  Plus,
  Minus,
  Ban,
  Search,
  Copy,
  ExternalLink,
  ChevronDown,
  User,
  Users,
  BookOpen,
  Flame,
  Package,
  Grid3x3,
} from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    post?: BooruPost;
    posts?: BooruPost[];
    index?: number | null;
    mode: BooruMode;
    queryTags?: string[];
    excludeTags?: string[];
    openTags?: boolean;
  }>(),
  {
    posts: () => [],
    index: null,
    queryTags: () => [],
    excludeTags: () => [],
    openTags: false,
  },
);

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
  "add-tag": [tag: string];
  "remove-tag": [tag: string];
  "exclude-tag": [tag: string];
  "search-tag": [tag: string];
}>();

const currentIndex = computed(() => props.index ?? 0);
const currentPost = computed(() => {
  if (props.posts && props.posts.length) return props.posts[currentIndex.value];
  return props.post ?? null;
});

const mediaType = computed(() => {
  if (!currentPost.value?.file_url) return "image";
  return getMediaType(currentPost.value.file_url);
});

const imageControls = useImageControls();
const { scaleMode, containerClass, imageClass } = imageControls;

const imageLoaded = ref(false);
const showTags = ref(props.openTags);
const tagMetadata = ref<Map<string, TagWithCategory>>(new Map());
const openMenuTag = ref<string | null>(null);
const tagFilterQuery = ref("");
const debouncedFilterQuery = ref("");
const copiedTag = ref<string | null>(null);
const expandedCategories = ref<Set<TagCategory>>(
  new Set(["artist", "character", "series", "general"]),
);
const menuOpenAbove = ref<Set<string>>(new Set());

const pointerStartX = ref<number | null>(null);
const pointerDeltaX = ref(0);

function useDebounce<T extends (...args: any[]) => void>(fn: T, wait = 150) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => fn(...args), wait);
  };

  onUnmounted(() => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  });

  return debounced;
}

const debouncedFilter = useDebounce((query: string) => {
  debouncedFilterQuery.value = query;
}, 150);

function onPointerDown(e: PointerEvent) {
  pointerStartX.value = e.clientX;
  pointerDeltaX.value = 0;
}

function onPointerMove(e: PointerEvent) {
  if (pointerStartX.value === null) return;
  pointerDeltaX.value = e.clientX - pointerStartX.value;
}

function onPointerUp() {
  if (pointerStartX.value === null) return;
  if (pointerDeltaX.value > 60) {
    emit("prev");
  } else if (pointerDeltaX.value < -60) {
    emit("next");
  }
  pointerStartX.value = null;
  pointerDeltaX.value = 0;
}

const tags = computed(() =>
  (currentPost.value?.tags ?? "")
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean),
);

const imageMeta = computed(() => {
  const parts: string[] = [];
  if (currentPost.value?.width && currentPost.value?.height) {
    parts.push(`${currentPost.value.width}×${currentPost.value.height}`);
  }
  parts.push(`${tags.value.length} tags`);
  return parts.join(" · ");
});

const categories = computed(() => {
  const result: Record<TagCategory, TagWithCategory[]> = {
    artist: [],
    character: [],
    series: [],
    copyright: [],
    general: [],
    other: [],
  };

  const query = debouncedFilterQuery.value.toLowerCase();

  for (const tag of tags.value) {
    const metadata = tagMetadata.value.get(tag);
    const tagMeta = metadata || {
      value: tag,
      label: tag.replace(/_/g, " "),
      category: "general" as TagCategory,
      post_count: 0,
    };

    if (
      query &&
      !tagMeta.label.toLowerCase().includes(query) &&
      !tag.toLowerCase().includes(query)
    ) {
      continue;
    }

    result[tagMeta.category].push(tagMeta);
  }

  return result;
});

const categoryLabels: Record<TagCategory, string> = {
  artist: "Artists",
  character: "Characters",
  series: "Series",
  copyright: "Copyright",
  general: "General",
  other: "Other",
};

watch(
  () => currentPost.value?.id,
  () => {
    imageLoaded.value = false;
    showTags.value = props.openTags;
    openMenuTag.value = null;
    tagFilterQuery.value = "";
    copiedTag.value = null;

    tagMetadata.value = categorizePostTags(currentPost.value as BooruPost);
  },
  { immediate: true },
);

watch(
  () => props.openTags,
  (value) => {
    if (value) showTags.value = true;
  },
);

const inQuery = computed(() => new Set(props.queryTags ?? []));
const inExclude = computed(() => new Set(props.excludeTags ?? []));

function getTagState(tag: string): "in query" | "excluded" | "neutral" {
  if (inQuery.value.has(tag)) return "in query";
  if (inExclude.value.has(tag)) return "excluded";
  return "neutral";
}

function checkMenuPosition(tagValue: string, event: Event) {
  const button = event.currentTarget as HTMLElement;

  requestAnimationFrame(() => {
    const buttonRect = button.getBoundingClientRect();
    const menuHeight = 360;
    const safeZone = 40;

    const spaceBelow = window.innerHeight - buttonRect.bottom;

    if (spaceBelow < menuHeight + safeZone) {
      menuOpenAbove.value.add(tagValue);
    } else {
      menuOpenAbove.value.delete(tagValue);
    }
  });
}

function copyTag(tag: string) {
  void navigator.clipboard?.writeText(tag);
  copiedTag.value = tag;
  setTimeout(() => {
    copiedTag.value = null;
  }, 1500);
}

function toggleCategory(category: TagCategory) {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category);
  } else {
    expandedCategories.value.add(category);
  }
}

function isCategoryExpanded(category: TagCategory): boolean {
  return expandedCategories.value.has(category);
}

function openTag(tag: string) {
  const sourceUrlMap: Record<BooruMode, string> = {
    safebooru: "https://safebooru.org/index.php?page=post&s=list&tags=",
    rule34: "https://rule34.xxx/index.php?page=post&s=list&tags=",
    gelbooru: "https://gelbooru.com/index.php?page=post&s=list&tags=",
    e621: "https://e621.net/posts?tags=",
  };
  
  const baseUrl = sourceUrlMap[props.mode];
  window.open(
    `${baseUrl}${encodeURIComponent(tag)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function handleKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    if (openMenuTag.value) {
      openMenuTag.value = null;
    } else {
      emit("close");
    }
  }
}

function handleNavigationKey(e: KeyboardEvent) {
  if (e.key === "ArrowLeft") {
    emit("prev");
  } else if (e.key === "ArrowRight") {
    emit("next");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKey);
  document.addEventListener("keydown", handleNavigationKey);
  document.body.style.overflow = "hidden";
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKey);
  document.removeEventListener("keydown", handleNavigationKey);
  document.body.style.overflow = "";
});

function addTag(tag: string) {
  emit("add-tag", tag);
  openMenuTag.value = null;
}

function removeTag(tag: string) {
  emit("remove-tag", tag);
  openMenuTag.value = null;
}

function excludeTag(tag: string) {
  emit("exclude-tag", tag);
  openMenuTag.value = null;
}

function searchTag(tag: string) {
  emit("search-tag", tag);
  openMenuTag.value = null;
}

async function downloadPost() {
  if (!currentPost.value?.file_url) return;
  const url = currentPost.value.file_url;
  const filename = `${currentPost.value.id}_${url.split("/").pop()}`;

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a2 = document.createElement("a");
      a2.href = blobUrl;
      a2.download = filename;
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      @click.self="emit('close')"
    >
      <button
        class="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-app-border bg-black/40 text-app-text-dim hover:text-app-text hover:bg-black/60 hover:border-app-border-deep"
        @click="emit('close')"
      >
        <X class="w-5 h-5" />
      </button>

      <div
        class="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center p-2"
        @click.stop
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          v-if="!imageLoaded"
          class="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 class="w-8 h-8 animate-spin text-app-text-dim" />
        </div>
        <div v-if="currentPost" :class="containerClass" class="relative">
          <img
            v-if="mediaType === 'image' || mediaType === 'gif'"
            :src="currentPost.file_url"
            :alt="`Post #${currentPost.id}`"
            @load="imageLoaded = true"
            :class="[imageLoaded ? 'opacity-100' : 'opacity-0', imageClass]"
          />
          <video
            v-else-if="mediaType === 'video'"
            :src="currentPost.file_url"
            :class="imageClass"
            autoplay
            loop
            muted
            playsinline
            controls
            @loadedmetadata="imageLoaded = true"
            @canplay="imageLoaded = true"
            @playing="imageLoaded = true"
          />
        </div>

        <button
          v-if="!showTags"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-app-text-dim hover:text-app-text transition-opacity"
          @click.stop.prevent="emit('prev')"
        >
          <svg
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
        </button>

        <button
          v-if="!showTags"
          class="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-app-text-dim hover:text-app-text transition-opacity"
          @click.stop.prevent="emit('next')"
        >
          <svg
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 6l6 6-6 6"
            />
          </svg>
        </button>
      </div>

      <div
        class="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 w-full pointer-events-none px-4"
      >
        <div class="pointer-events-auto">
          <ImageControls
            :scale-mode="scaleMode"
            @update:scale-mode="scaleMode = $event"
          />
        </div>

        <div
          class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5 py-2.5 rounded-2xl text-[10px] sm:text-xs font-mono bg-black/80 border border-app-border-deep text-app-text-dim shadow-xl backdrop-blur-md"
        >
          <span class="text-app-text-muted font-bold"
            >#{{ currentPost?.id }}</span
          >
          <span class="w-1 h-1 rounded-full bg-app-border"></span>
          <span class="uppercase tracking-widest">{{
            currentPost?.rating
          }}</span>
          <template v-if="currentPost?.score">
            <span class="w-1 h-1 rounded-full bg-app-border"></span>
            <span class="text-app-text-muted font-bold"
              >+{{ currentPost.score }}</span
            >
          </template>
          <template v-if="imageMeta">
            <span class="w-1 h-1 rounded-full bg-app-border"></span>
            <span class="font-bold">{{ imageMeta }}</span>
          </template>
          <template v-if="currentPost?.source">
            <span class="w-1 h-1 rounded-full bg-app-border"></span>
            <a
              :href="currentPost.source"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-app-border hover:decoration-app-text-dim text-app-text-muted hover:text-app-text transition-all"
              @click.stop
            >
              source
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </template>
          <template v-if="currentPost?.file_url">
            <span class="w-1 h-1 rounded-full bg-app-border"></span>
            <button
              class="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-app-border hover:decoration-app-text-dim text-app-text-muted hover:text-app-text transition-all"
              @click.stop.prevent="downloadPost"
            >
              Download
              <Download class="w-3.5 h-3.5" />
            </button>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="pointer-events-auto inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all bg-black/80 border border-app-border text-app-text-muted hover:text-app-text hover:border-app-text-dim hover:bg-black/90 backdrop-blur-sm active:scale-95"
            @click="showTags = !showTags"
          >
            <Tag class="w-4 h-4" />
            Tags ({{ tags.length }})
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-24"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-24"
      >
        <div
          v-if="showTags"
          class="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 max-h-[85vh] flex flex-col items-center"
          @click.stop
        >
          <div
            class="w-full max-w-4xl rounded-4xl overflow-hidden flex flex-col max-h-full bg-app-bg-1 border border-app-border-deep shadow-2xl shadow-black/80"
          >
            <div
              class="flex items-center justify-between px-8 py-5 border-b border-app-border shrink-0 bg-app-bg-2/50 backdrop-blur-md"
            >
              <div class="min-w-0">
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-app-text-dim"
                >
                  Inspector
                </p>
                <p class="text-sm font-bold text-app-text">
                  {{ Object.values(categories).flat().length }} Tags Found
                </p>
              </div>
              <div class="flex items-center gap-4">
                <button
                  class="p-2 rounded-xl transition-all hover:bg-app-bg-3 text-app-text-dim hover:text-app-text"
                  @click="showTags = false"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              class="px-8 py-4 border-b border-app-border shrink-0 bg-app-bg-1/80"
            >
              <div class="relative group">
                <Search
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-dim/50 group-focus-within:text-app-text transition-colors"
                />
                <input
                  v-model="tagFilterQuery"
                  @input="debouncedFilter(tagFilterQuery)"
                  type="text"
                  placeholder="Filter by name..."
                  class="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-bold bg-app-bg-2 border border-app-border focus:border-app-text-dim focus:bg-app-bg-1 transition-all outline-none text-app-text placeholder:text-app-text-dim/30"
                />
              </div>
            </div>

            <div
              class="flex-1 overflow-y-auto px-8 py-6 space-y-4 no-scrollbar"
              data-drawer
            >
              <div
                v-for="category in [
                  'artist',
                  'character',
                  'series',
                  'copyright',
                  'general',
                  'other',
                ] as const"
                :key="category"
                v-show="categories[category].length > 0"
                class="rounded-2xl border border-app-border bg-app-bg-2/30 overflow-hidden"
              >
                <button
                  class="w-full px-5 py-4 flex items-center justify-between hover:bg-app-bg-2 transition-all group"
                  @click="toggleCategory(category)"
                >
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-app-bg-1 border border-app-border group-hover:border-app-text-dim"
                    >
                      <component
                        :is="
                          category === 'artist'
                            ? User
                            : category === 'character'
                              ? Users
                              : category === 'series'
                                ? BookOpen
                                : category === 'copyright'
                                  ? Flame
                                  : category === 'general'
                                    ? Grid3x3
                                    : Package
                        "
                        class="w-5 h-5"
                        :style="`color: ${CATEGORY_COLORS[category].text}`"
                      />
                    </div>
                    <div class="text-left">
                      <p
                        class="text-[10px] font-black uppercase tracking-widest opacity-60"
                        :style="`color: ${CATEGORY_COLORS[category].text}`"
                      >
                        {{ categoryLabels[category] }}
                      </p>
                      <p class="text-xs font-bold text-app-text">
                        {{ categories[category].length }} tag{{
                          categories[category].length !== 1 ? "s" : ""
                        }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:bg-app-bg-3"
                  >
                    <ChevronDown
                      class="w-4 h-4 text-app-text-dim transition-transform duration-300"
                      :class="{ 'rotate-180': isCategoryExpanded(category) }"
                    />
                  </div>
                </button>

                <div v-if="isCategoryExpanded(category)" class="px-5 pb-5 pt-1">
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"
                  >
                    <div
                      v-for="tagItem in categories[category]"
                      :key="tagItem.value"
                      class="relative group"
                    >
                      <BaseTag
                        :tag="tagItem.value"
                        :label="tagItem.label"
                        :category="tagItem.category"
                        :state="
                          getTagState(tagItem.value) === 'in query'
                            ? 'active'
                            : getTagState(tagItem.value) === 'excluded'
                              ? 'excluded'
                              : 'neutral'
                        "
                        clickable
                        class="w-full"
                        @click.stop="
                          openMenuTag =
                            openMenuTag === tagItem.value
                              ? null
                              : tagItem.value;
                          checkMenuPosition(tagItem.value, $event);
                        "
                      >
                        <template #default>
                          <div
                            class="flex items-center justify-between gap-2 w-full min-w-0"
                          >
                            <span class="truncate flex-1 text-left">{{
                              tagItem.label
                            }}</span>
                            <ChevronDown
                              class="w-3.5 h-3.5 shrink-0 transition-transform duration-200 opacity-40 group-hover:opacity-100"
                              :class="{
                                'rotate-180': openMenuTag === tagItem.value,
                              }"
                            />
                          </div>
                        </template>
                      </BaseTag>

                      <Transition
                        enter-active-class="transition-all duration-100"
                        enter-from-class="opacity-0 translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition-all duration-75"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 translate-y-1"
                      >
                        <div
                          v-if="openMenuTag === tagItem.value"
                          class="absolute left-0 z-20 rounded-xl overflow-hidden border border-app-border-deep bg-app-bg-1 shadow-2xl min-w-50"
                          :class="
                            menuOpenAbove.has(tagItem.value)
                              ? 'bottom-full mb-2'
                              : 'top-full mt-2'
                          "
                        >
                          <button
                            v-if="getTagState(tagItem.value) === 'neutral'"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 text-app-text-muted hover:text-app-text active:scale-95"
                            @click="addTag(tagItem.value)"
                          >
                            <Plus class="w-4 h-4 shrink-0 text-emerald-400" />
                            <span class="truncate">Add tag</span>
                          </button>
                          <button
                            v-else
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 text-app-text-muted hover:text-app-text active:scale-95"
                            @click="removeTag(tagItem.value)"
                          >
                            <Minus class="w-4 h-4 shrink-0 text-red-400" />
                            <span class="truncate">Remove</span>
                          </button>
                          <button
                            v-if="getTagState(tagItem.value) === 'neutral'"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 text-app-text-muted hover:text-app-text active:scale-95"
                            @click="excludeTag(tagItem.value)"
                          >
                            <Ban class="w-4 h-4 shrink-0 text-orange-400" />
                            <span class="truncate">Exclude</span>
                          </button>
                          <button
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 text-app-text-muted hover:text-app-text active:scale-95"
                            @click="searchTag(tagItem.value)"
                          >
                            <Search class="w-4 h-4 shrink-0 text-blue-400" />
                            <span class="truncate">Search only</span>
                          </button>
                          <div class="mx-2 h-px bg-app-border my-1" />
                          <button
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 active:scale-95"
                            :class="
                              copiedTag === tagItem.value
                                ? 'text-app-text bg-white/5'
                                : 'text-app-text-muted hover:text-app-text'
                            "
                            @click="copyTag(tagItem.value)"
                          >
                            <Copy class="w-4 h-4 shrink-0" />
                            <span class="truncate">{{
                              copiedTag === tagItem.value ? "Copied!" : "Copy"
                            }}</span>
                          </button>
                          <button
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 text-app-text-muted hover:text-app-text active:scale-95"
                            @click="openTag(tagItem.value)"
                          >
                            <ExternalLink class="w-4 h-4 shrink-0" />
                            <span class="truncate">Open in new tab</span>
                          </button>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
