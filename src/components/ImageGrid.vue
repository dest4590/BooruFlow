<script setup lang="ts">
import { ref, computed, toRef } from "vue";
import type { BooruMode } from "../composables/useSettings";
import { alwaysLoadHighRes } from "../composables/useSettings";
import type { BooruPost } from "../composables/useBooru";
import { getMediaType } from "../composables/useBooru";
import { Loader2, Ban, Play } from "@lucide/vue";
import ImageLightbox from "./ImageLightbox.vue";

const props = defineProps<{
  posts: BooruPost[];
  loading: boolean;
  hasMore: boolean;
  mode: BooruMode;
  queryTags: string[];
}>();

const postsRef = toRef(props, "posts");

const emit = defineEmits<{
  "load-more": [];
  "add-tag": [tag: string];
  "remove-tag": [tag: string];
  "search-tag": [tag: string];
}>();

const lightboxIndex = ref<number | null>(null);
const lightboxOpenTags = ref(false);
const loaded = ref<Set<number>>(new Set());

const pointerStartX = ref<number | null>(null);
const pointerStartY = ref<number | null>(null);
const pointerMoved = ref(false);
const pointerActiveIndex = ref<number | null>(null);

function markLoaded(id: number) {
  loaded.value.add(id);
}

function openLightbox(idx: number, openTags = false) {
  lightboxIndex.value = idx;
  lightboxOpenTags.value = openTags;
}

function onPointerDown(e: PointerEvent, idx: number) {
  pointerActiveIndex.value = idx;
  pointerMoved.value = false;
  pointerStartX.value = e.clientX;
  pointerStartY.value = e.clientY;
}

function onPointerMove(e: PointerEvent) {
  if (pointerStartX.value === null || pointerStartY.value === null) return;
  const dx = Math.abs(e.clientX - pointerStartX.value);
  const dy = Math.abs(e.clientY - pointerStartY.value);
  if (dx > 8 || dy > 8) pointerMoved.value = true;
}

function onPointerUp(e: PointerEvent, idx: number, openTags = false) {
  const target = e.target as Element | null;
  if (
    target &&
    target.closest &&
    target.closest("button, a, input, select, textarea")
  ) {
    pointerActiveIndex.value = null;
    pointerStartX.value = null;
    pointerStartY.value = null;
    pointerMoved.value = false;
    return;
  }

  if (pointerActiveIndex.value === idx && !pointerMoved.value) {
    openLightbox(idx, openTags);
  }
  pointerActiveIndex.value = null;
  pointerStartX.value = null;
  pointerStartY.value = null;
  pointerMoved.value = false;
}

function prevLightbox() {
  if (lightboxIndex.value === null) return;
  lightboxIndex.value = Math.max(0, lightboxIndex.value - 1);
}

function nextLightbox() {
  if (lightboxIndex.value === null) return;
  if (lightboxIndex.value < (postsRef.value?.length ?? 0) - 1)
    lightboxIndex.value = lightboxIndex.value + 1;
}

const loadingVisible = computed(() => loaded.value);

function getImageSrc(post: BooruPost): string {
  return alwaysLoadHighRes.value
    ? post.file_url
    : post.preview_url || post.file_url;
}

function isVideoOrGif(post: BooruPost): boolean {
  const type = getMediaType(post.file_url);
  return type === "video" || type === "gif";
}
</script>

<template>
  <div>
    <div
      v-if="posts.length > 0"
      class="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2"
    >
      <div
        v-for="(post, index) in posts"
        :key="post.id"
        class="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-[20px] bg-app-bg-1 border border-app-border transition-all hover:border-app-text-dim/30 hover:shadow-xl hover:shadow-black/40 mb-2"
        style="touch-action: pan-y"
        @pointerdown="onPointerDown($event, index)"
        @pointermove.passive="onPointerMove($event)"
        @pointerup="onPointerUp($event, index, false)"
      >
        <div
          v-if="!loadingVisible.has(post.id)"
          class="absolute inset-0 z-10 flex items-center justify-center bg-app-bg-2"
        >
          <Loader2 class="w-6 h-6 animate-spin text-app-text-dim/40" />
        </div>
        <div
          v-if="isVideoOrGif(post)"
          class="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-wider"
        >
          <Play class="w-3 h-3" />
          {{ getMediaType(post.file_url) === "gif" ? "GIF" : "Video" }}
        </div>
        <img
          :src="getImageSrc(post)"
          :alt="`#${post.id}`"
          loading="lazy"
          :width="post.width"
          :height="post.height"
          class="w-full h-auto block transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-110"
          :class="loadingVisible.has(post.id) ? 'opacity-100' : 'opacity-0'"
          @load="markLoaded(post.id)"
        />
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 translate-y-2 group-hover:translate-y-0"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50"
              >
                #{{ post.id }}
              </span>
              <div class="flex items-center gap-2">
                <span
                  class="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-white/20"
                  :class="
                    post.rating === 'safe' || post.rating === 'general'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  "
                >
                  {{ post.rating }}
                </span>
                <span
                  v-if="post.score"
                  class="text-[10px] font-black text-white"
                >
                  {{ post.score > 0 ? "+" : "" }}{{ post.score }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="posts.length > 0" class="flex justify-center mt-12 mb-8">
      <button
        v-if="hasMore"
        :disabled="loading"
        class="px-10 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 bg-app-bg-2 border border-app-border-deep text-app-text-muted hover:border-app-text-dim hover:text-app-text hover:bg-app-bg-3 shadow-sm hover:shadow-md"
        @click="emit('load-more')"
      >
        <div v-if="loading" class="flex items-center gap-3">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Fetching posts...</span>
        </div>
        <span v-else>Load More</span>
      </button>
      <div v-else class="flex flex-col items-center gap-4 py-8 opacity-40">
        <Ban class="w-8 h-8 text-app-text-dim" />
        <p
          class="text-sm font-bold uppercase tracking-widest text-app-text-dim"
        >
          End of Search
        </p>
      </div>
    </div>

    <ImageLightbox
      v-if="lightboxIndex !== null"
      :posts="posts"
      :index="lightboxIndex"
      :mode="mode"
      :query-tags="queryTags"
      :open-tags="lightboxOpenTags"
      @close="lightboxIndex = null"
      @prev="prevLightbox"
      @next="nextLightbox"
      @add-tag="emit('add-tag', $event)"
      @remove-tag="emit('remove-tag', $event)"
      @search-tag="emit('search-tag', $event)"
    />
  </div>
</template>
