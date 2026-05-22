<script setup lang="ts">
import { computed } from "vue";
import type { TagCategory } from "../composables/useBooru";
import { CATEGORY_COLORS } from "../composables/useBooru";
import { X } from "@lucide/vue";

interface Props {
  tag: string;
  label?: string;
  category?: TagCategory;
  state?: "active" | "excluded" | "neutral";
  removable?: boolean;
  clickable?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: (p) => p.tag.replace(/_/g, " "),
  category: "general",
  state: "neutral",
  removable: false,
  clickable: false,
  compact: false,
});

const emit = defineEmits<{
  remove: [];
  click: [event: MouseEvent];
}>();

const styles = computed(() => {
  if (props.state === "excluded") {
    return {
      background: "var(--color-red-500) / 10%",
      color: "var(--color-red-400)",
      borderColor: "var(--color-red-500) / 30%",
    };
  }

  const colors = CATEGORY_COLORS[props.category] || CATEGORY_COLORS.general;

  if (props.state === "active") {
    return {
      background: colors.text,
      color: "var(--color-app-bg)",
      borderColor: colors.text,
    };
  }

  return {
    background: `${colors.text}10`,
    color: colors.text,
    borderColor: `${colors.text}30`,
  };
});
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="inline-flex items-center gap-2 rounded-lg font-bold border transition-all overflow-hidden shrink-0"
    :class="[
      compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs',
      clickable
        ? 'cursor-pointer hover:brightness-125 active:scale-95 shadow-sm hover:shadow-md'
        : 'cursor-default',
    ]"
    :style="styles"
    @click="clickable ? emit('click', $event) : undefined"
  >
    <div v-if="state === 'excluded'" class="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
    <slot>
      <span class="truncate tracking-tight">{{ label }}</span>
    </slot>
    <button
      v-if="removable"
      class="w-4 h-4 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors ml-1"
      @click.stop="emit('remove')"
    >
      <X class="w-3 h-3" />
    </button>
  </component>
</template>

