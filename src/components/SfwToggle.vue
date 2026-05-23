<script setup lang="ts">
import { ref } from "vue";
import type { BooruMode } from "../composables/useSettings";
import { SOURCE_CATEGORIES } from "../composables/useSettings";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{ modelValue: BooruMode }>();
const emit = defineEmits<{ "update:modelValue": [value: BooruMode] }>();

const confirming = ref(false);

function toggle() {
  if (SOURCE_CATEGORIES[props.modelValue] === "sfw") {
    confirming.value = true;
  } else {
    emit("update:modelValue", "safebooru");
  }
}

function confirm() {
  confirming.value = false;
  emit("update:modelValue", "rule34");
}

function cancel() {
  confirming.value = false;
}
</script>

<template>
  <button
    type="button"
    class="group relative inline-flex items-center gap-2.5 h-8 px-3 rounded-full text-xs font-bold leading-none select-none transition-all duration-300 self-center"
    :class="
      SOURCE_CATEGORIES[modelValue] === 'nsfw'
        ? 'bg-app-bg-3 border border-app-border-deep text-app-text shadow-sm'
        : 'bg-transparent border border-app-border text-app-text-dim hover:border-app-text-muted hover:text-app-text'
    "
    :title="SOURCE_CATEGORIES[modelValue] === 'sfw' ? 'Enable NSFW mode' : 'Switch to SFW mode'"
    @click="toggle"
  >
    <div
      class="relative w-8 h-4.5 rounded-full transition-all duration-300 shrink-0"
      :class="
        SOURCE_CATEGORIES[modelValue] === 'nsfw'
          ? 'bg-app-text'
          : 'bg-app-bg-3 border border-app-border'
      "
    >
      <div
        class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-300"
        :class="
          SOURCE_CATEGORIES[modelValue] === 'nsfw'
            ? 'translate-x-4 bg-app-bg'
            : 'translate-x-0 bg-app-text-dim'
        "
      />
    </div>

    <span class="tracking-widest uppercase text-[10px]">NSFW</span>
  </button>

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
