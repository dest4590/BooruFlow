<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { AutocompleteItem } from "../composables/useBooru";
import {
  autocomplete,
  type TagCategory,
  CATEGORY_COLORS,
  TAG_TYPE_MAP,
} from "../composables/useBooru";
import type { BooruMode } from "../composables/useSettings";
import BaseTag from "./BaseTag.vue";

const props = defineProps<{
  modelValue: string;
  mode: BooruMode;
  loading: boolean;
  compact?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputVal = ref("");
const suggestions = ref<AutocompleteItem[]>([]);
const showSuggestions = ref(false);
const selectedIdx = ref(-1);

function splitTags(value: string): string[] {
  return (
    value
      .trim()
      .split(/\s*,\s*/)
      ?.map((tag) => tag.replace(/^"|"$/g, ""))
      .filter(Boolean) ?? []
  );
}

function formatTags(tags: string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}

const chips = computed(() =>
  props.modelValue.trim() ? splitTags(props.modelValue) : [],
);

let debounce: ReturnType<typeof setTimeout> | null = null;

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  inputVal.value = val;
  if (debounce) clearTimeout(debounce);
  if (val.trim().length < 2) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  debounce = setTimeout(async () => {
    suggestions.value = await autocomplete(val.trim(), props.mode);
    showSuggestions.value = suggestions.value.length > 0;
    selectedIdx.value = -1;
  }, 280);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "," && inputVal.value.trim() && !showSuggestions.value) {
    e.preventDefault();
    addTag(inputVal.value.trim());
    return;
  }
  if (e.key === "Enter" && !inputVal.value.trim()) {
    e.preventDefault();
    emit("search");
    return;
  }
  if (e.key === "Enter" && inputVal.value.trim() && !showSuggestions.value) {
    e.preventDefault();
    addTag(inputVal.value.trim());
    inputRef.value?.focus();
    return;
  }
  if (e.key === "Backspace" && !inputVal.value && chips.value.length) {
    removeLastTag();
    return;
  }
  if (!showSuggestions.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIdx.value = Math.min(
      selectedIdx.value + 1,
      suggestions.value.length - 1,
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIdx.value = Math.max(selectedIdx.value - 1, -1);
  } else if (e.key === "Enter" && selectedIdx.value >= 0) {
    e.preventDefault();
    applySuggestion(suggestions.value[selectedIdx.value]);
  } else if (e.key === "Escape") {
    closeSugg();
  }
}

function addTag(tag: string) {
  emit("update:modelValue", formatTags([...chips.value, tag]));
  inputVal.value = "";
  closeSugg();
}

function removeTag(i: number) {
  const arr = [...chips.value];
  arr.splice(i, 1);
  emit("update:modelValue", formatTags(arr));
}

function removeLastTag() {
  const arr = [...chips.value];
  arr.pop();
  emit("update:modelValue", formatTags(arr));
}

function applySuggestion(item: AutocompleteItem) {
  addTag(item.value);
  inputRef.value?.focus();
}

function onBlur() {
  window.setTimeout(closeSugg, 160);
}
function closeSugg() {
  showSuggestions.value = false;
  selectedIdx.value = -1;
}
function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

function getTagCategory(item: AutocompleteItem): TagCategory {
  return TAG_TYPE_MAP[item.type ?? 0] ?? "general";
}

watch(
  () => props.modelValue,
  () => {
    inputVal.value = "";
  },
);

function clearAll() {
  emit("update:modelValue", "");
  inputVal.value = "";
  inputRef.value?.focus();
}
</script>

<template>
  <div class="relative w-full space-y-3">
    <div
      class="search-box flex items-center rounded-2xl transition-all overflow-visible bg-app-bg-2 border border-app-border-deep shadow-sm focus-within:border-app-text-dim focus-within:ring-1 focus-within:ring-app-text-dim/20"
      :class="compact ? 'h-9' : 'h-14'"
    >
      <div class="flex items-center flex-1 min-w-0 h-full pl-5 pr-2">
        <input
          ref="inputRef"
          :value="inputVal"
          type="text"
          :placeholder="
            compact ? 'Search tags...' : 'Add tags (comma separated)'
          "
          class="flex-1 bg-transparent outline-none py-2 text-app-text placeholder:text-app-text-dim/50 caret-app-text"
          :class="compact ? 'text-xs px-1' : 'text-sm px-2'"
          @input="onInput"
          @keydown="onKeydown"
          @blur="onBlur"
        />
      </div>

      <button
        v-if="chips.length || inputVal"
        class="shrink-0 px-3 h-full flex items-center text-app-text-dim hover:text-app-text transition-all"
        title="Clear search"
        @click="clearAll"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <button
        :disabled="loading || (!chips.length && !inputVal.trim())"
        class="shrink-0 px-5 h-full flex items-center text-app-text-muted hover:text-app-text transition-all disabled:opacity-20 active:scale-95"
        title="Submit search"
        @click="emit('search')"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path stroke-linecap="round" d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </div>

    <div v-if="chips.length" class="flex flex-wrap gap-2">
      <BaseTag
        v-for="(tag, i) in chips"
        :key="tag + i"
        :tag="tag"
        :state="tag.startsWith('-') ? 'excluded' : 'neutral'"
        :removable="true"
        :compact="compact"
        @remove="removeTag(i)"
      />
    </div>

    <Transition
      enter-active-class="transition-all duration-100"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-75"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <ul
        v-if="showSuggestions"
        class="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl py-1 bg-app-bg-1 border border-app-border-deep shadow-2xl backdrop-blur-xl"
      >
        <li
          v-for="(item, i) in suggestions.slice(0, 10)"
          :key="item.value"
          class="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all gap-4"
          :class="i === selectedIdx ? 'bg-app-bg-3' : 'hover:bg-app-bg-2'"
          @mouseenter="selectedIdx = i"
          @mouseleave="selectedIdx = -1"
          @mousedown.prevent="applySuggestion(item)"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span
              class="text-[9px] uppercase tracking-widest font-black shrink-0 rounded-md px-1.5 py-0.5 border"
              :style="{
                background: `${CATEGORY_COLORS[getTagCategory(item)].text}15`,
                color: CATEGORY_COLORS[getTagCategory(item)].text,
                borderColor: `${CATEGORY_COLORS[getTagCategory(item)].text}40`,
              }"
            >
              {{ getTagCategory(item).slice(0, 3) }}
            </span>
            <span
              class="text-sm font-bold truncate transition-colors"
              :class="
                i === selectedIdx ? 'text-app-text' : 'text-app-text-muted'
              "
            >
              {{ item.label }}
            </span>
          </div>
          <span
            v-if="item.post_count > 0"
            class="text-[11px] font-bold ml-4 tabular-nums shrink-0 text-app-text-dim"
          >
            {{ fmt(item.post_count) }}
          </span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
