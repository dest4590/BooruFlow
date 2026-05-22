<script setup lang="ts">
const props = defineProps<{
  options: ReadonlyArray<readonly [string, string]>;
  modelValue: string;
  label?: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="space-y-2">
    <p
      v-if="label"
      class="text-xs px-1 uppercase tracking-widest text-app-text-dim font-bold"
    >
      {{ label }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="[value, label] in options"
        :key="value"
        class="flex-1 min-w-20 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border border-app-border"
        :class="
          modelValue === value
            ? 'bg-app-text text-app-bg border-app-text shadow-lg'
            : 'bg-app-bg-2 text-app-text-muted'
        "
        @click="$emit('update:modelValue', value)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>
