<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label?: string;
  description?: string;
  color?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<template>
  <label class="flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all hover:bg-app-bg-3/50 bg-app-bg-2 border border-app-border">
    <div class="flex-1 mr-4">
      <p v-if="label" class="text-xs font-black uppercase tracking-widest text-app-text-dim mb-1">
        {{ label }}
      </p>
      <p v-if="description" class="text-sm font-bold text-app-text">
        {{ description }}
      </p>
    </div>
    
    <div
      class="relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out shrink-0"
      :class="modelValue ? 'bg-app-text' : 'bg-app-bg-1 border border-app-border'"
    >
      <input
        type="checkbox"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <div
        class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-300 ease-in-out"
        :class="modelValue ? 'translate-x-6 bg-app-bg' : 'translate-x-0 bg-app-text-dim'"
      />
    </div>
  </label>
</template>

