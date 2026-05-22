<script setup lang="ts">
import type { BooruMode } from "@/composables/useSettings";
import BaseSegmentedControl from "./BaseSegmentedControl.vue";
import { ref, onMounted, onUnmounted } from "vue";
import { X } from "lucide-vue-next";

export interface Filters {
  sort: "default" | "score" | "random";
  minScore: number | null;
  rating: "any" | "s" | "q";
  excludeTags: string[];
}

const props = defineProps<{
  filters: Filters;
  mode: BooruMode;
}>();

const emit = defineEmits<{
  update: [filters: Filters];
  close: [];
}>();

const local = ref<Filters>(JSON.parse(JSON.stringify(props.filters)));
const excludeInput = ref("");
const excludeInputRef = ref<HTMLInputElement | null>(null);

const SCORE_OPTIONS = [
  null,
  0,
  5,
  10,
  25,
  50,
  75,
  100,
  200,
  300,
  500,
  750,
  1000,
];

function addExclude() {
  const tag = excludeInput.value.trim().replace(/^-+/, "");
  if (!tag || local.value.excludeTags.includes(tag)) {
    excludeInput.value = "";
    return;
  }
  local.value.excludeTags = [...local.value.excludeTags, tag];
  excludeInput.value = "";
}

function removeExclude(tag: string) {
  local.value.excludeTags = local.value.excludeTags.filter((t) => t !== tag);
}

function addExcludeTags(tags: string[]) {
  const next = new Set(local.value.excludeTags);
  for (const rawTag of tags) {
    const tag = rawTag.trim().replace(/^-+/, "");
    if (tag) next.add(tag);
  }
  local.value.excludeTags = [...next];
}

function onExcludePaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text") ?? "";
  if (!text.trim()) return;

  const tags = text
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!tags.length) return;

  e.preventDefault();
  addExcludeTags(tags);
  excludeInput.value = "";
}

function onExcludeKey(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " " || e.key === ",") {
    e.preventDefault();
    addExclude();
  } else if (
    e.key === "Backspace" &&
    !excludeInput.value &&
    local.value.excludeTags.length
  ) {
    local.value.excludeTags = local.value.excludeTags.slice(0, -1);
  } else if (e.key === "Escape") {
    emit("close");
  }
}

function apply() {
  emit("update", JSON.parse(JSON.stringify(local.value)));
  emit("close");
}

function handleKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => document.addEventListener("keydown", handleKey));
onUnmounted(() => document.removeEventListener("keydown", handleKey));
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-12"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-12"
      >
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-sm flex flex-col bg-app-bg-1 border-l border-app-border-deep shadow-2xl"
        >
          <div
            class="flex items-center justify-end px-6 py-4 border-b border-app-border shrink-0"
          >
            <button
              class="p-2 rounded-xl transition-all hover:bg-app-bg-3 text-app-text-dim hover:text-app-text"
              @click="emit('close')"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div
            class="overflow-y-auto px-6 py-4 flex flex-col gap-8 no-scrollbar"
          >
            <BaseSegmentedControl
              v-model="local.sort"
              label="Sorting Strategy"
              :options="[
                ['default', 'Newest'],
                ['score', 'Highly Rated'],
                ['random', 'Random'],
              ]"
            />

            <div class="space-y-3">
              <div class="flex items-center justify-between px-1">
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-app-text-dim"
                >
                  Minimum Score
                </p>
                <div
                  class="px-2 py-0.5 rounded-lg bg-app-bg-3 text-app-text font-bold text-[10px]"
                >
                  &ge; {{ local.minScore === null ? "Any" : local.minScore }}
                </div>
              </div>
              <div
                class="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-app-bg-2 border border-app-border"
              >
                <button
                  v-for="val in SCORE_OPTIONS"
                  :key="String(val)"
                  class="flex-1 min-w-9.5 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-90"
                  :class="
                    local.minScore === val
                      ? 'bg-app-text text-app-bg shadow-sm'
                      : 'text-app-text-dim hover:text-app-text hover:bg-app-bg-3'
                  "
                  @click="local.minScore = val"
                >
                  {{ val === null ? "Ø" : val }}
                </button>
              </div>
            </div>

            <BaseSegmentedControl
              v-if="mode === 'nsfw'"
              v-model="local.rating"
              label="Content Rating"
              :options="[
                ['any', 'Unlimited'],
                ['s', 'Safe Only'],
                ['q', 'Questionable'],
              ]"
            />

            <div class="space-y-3">
              <p
                class="text-[10px] font-black uppercase tracking-widest text-app-text-dim px-1"
              >
                Blocked Tags
              </p>
              <div
                class="flex flex-wrap gap-2 p-3 rounded-2xl min-h-24 cursor-text bg-app-bg-2 border border-app-border focus-within:border-app-text-dim transition-colors shadow-inner"
                @click="excludeInputRef?.focus()"
              >
                <span
                  v-for="tag in local.excludeTags"
                  :key="tag"
                  class="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg text-[11px] font-bold bg-app-bg-1 border border-red-500/30 text-red-400 transition-all hover:bg-red-500/5 group"
                >
                  <span class="opacity-50 text-[10px]">&minus;</span>{{ tag }}
                  <button
                    class="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-colors"
                    @mousedown.prevent="removeExclude(tag)"
                  >
                    <X class="w-3 h-3 text-red-400" />
                  </button>
                </span>
                <input
                  ref="excludeInputRef"
                  v-model="excludeInput"
                  type="text"
                  placeholder="Type tag..."
                  class="flex-1 min-w-20 bg-transparent outline-none text-[11px] font-bold text-app-text placeholder:text-app-text-dim/40 py-1"
                  @keydown="onExcludeKey"
                  @blur="addExclude"
                  @paste="onExcludePaste"
                />
              </div>
            </div>
          </div>

          <div
            class="px-6 py-6 border-t border-app-border bg-app-bg-1 mt-auto shrink-0"
          >
            <button
              class="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all bg-app-text text-app-bg hover:opacity-90 active:scale-95 shadow-lg shadow-white/5 disabled:opacity-20 flex items-center justify-center gap-3"
              @click="apply"
            >
              Update Search
            </button>
          </div>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>
