<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "@lucide/vue";
import type { BooruMode } from "../composables/useSettings";
import {
  SOURCE_DISPLAY_NAMES,
  SOURCE_CATEGORIES,
} from "../composables/useSettings";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{ modelValue: BooruMode }>();
const emit = defineEmits<{ "update:modelValue": [value: BooruMode] }>();

const isOpen = ref(false);
const confirming = ref(false);
let pendingSelection: BooruMode | null = null;

const sources: BooruMode[] = ["safebooru", "rule34", "gelbooru", "e621"];

function selectSource(source: BooruMode) {
  const currentCategory = SOURCE_CATEGORIES[props.modelValue];
  const targetCategory = SOURCE_CATEGORIES[source];
  if (currentCategory === "sfw" && targetCategory === "nsfw") {
    pendingSelection = source;
    confirming.value = true;
    return;
  }

  emit("update:modelValue", source);
  isOpen.value = false;
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function confirm() {
  if (pendingSelection) {
    emit("update:modelValue", pendingSelection);
  }
  pendingSelection = null;
  confirming.value = false;
  isOpen.value = false;
}

function cancel() {
  pendingSelection = null;
  confirming.value = false;
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all border"
      :class="
        isOpen
          ? 'border-app-text bg-app-bg-3 text-app-text shadow-sm'
          : 'border-app-border bg-app-bg-2 text-app-text-muted hover:bg-app-bg-3 hover:border-app-text-dim hover:text-app-text'
      "
      @click="toggleOpen"
    >
      <span class="uppercase tracking-widest">{{
        SOURCE_DISPLAY_NAMES[modelValue]
      }}</span>
      <ChevronDown
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full left-0 right-0 mt-1 bg-app-bg-2 border border-app-border rounded-lg shadow-lg overflow-hidden z-50"
    >
      <button
        v-for="source in sources"
        :key="source"
        type="button"
        class="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-all hover:bg-app-bg-3 border-b border-app-border last:border-b-0"
        :class="
          modelValue === source
            ? 'bg-app-bg-3 text-app-text'
            : 'text-app-text-muted hover:text-app-text'
        "
        @click="selectSource(source)"
      >
        <div class="flex items-center gap-2">
          <span class="uppercase tracking-widest">{{
            SOURCE_DISPLAY_NAMES[source]
          }}</span>
          <span
            class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            :class="
              SOURCE_CATEGORIES[source] === 'sfw'
                ? 'bg-green-900/30 text-green-300'
                : 'bg-red-900/30 text-red-300'
            "
          >
            {{ SOURCE_CATEGORIES[source] }}
          </span>
        </div>
        <div
          v-if="modelValue === source"
          class="w-2 h-2 rounded-full bg-app-text"
        ></div>
      </button>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-30" @click="isOpen = false"></div>
  </teleport>
  <BaseModal :open="confirming" title="Enable NSFW?" @close="cancel">
    <p class="text-sm leading-relaxed text-app-text-dim">
      You are about to enable NSFW content. Please confirm that you are at least
      18 years old and that viewing such content is legal in your current
      location.
    </p>

    <template #footer>
      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all bg-app-bg-2 text-app-text-muted border border-app-border hover:border-app-text-muted"
        @click="cancel"
      >
        Cancel
      </button>

      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all bg-app-text text-app-bg hover:opacity-90 shadow-lg shadow-white/5"
        @click="confirm"
      >
        Continue
      </button>
    </template>
  </BaseModal>
</template>
