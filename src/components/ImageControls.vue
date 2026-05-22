<script setup lang="ts">
defineProps<{
  scaleMode: "fit" | "actual";
}>();

const emit = defineEmits<{
  "update:scaleMode": ["fit" | "actual"];
}>();
</script>

<template>
  <div class="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md hover:border-white/20 transition-colors">
    <button
      class="px-3 py-1 text-[11px] font-semibold rounded-md transition-all duration-200"
      :class="
        scaleMode === 'fit'
          ? 'bg-white/15 text-white'
          : 'text-white/50 hover:text-white/70'
      "
      @click="emit('update:scaleMode', 'fit')"
      title="Fit to viewport"
    >
      Fit
    </button>
    <div class="w-px h-4 bg-white/10" />
    <button
      class="px-3 py-1 text-[11px] font-semibold rounded-md transition-all duration-200"
      :class="
        scaleMode === 'actual'
          ? 'bg-white/15 text-white'
          : 'text-white/50 hover:text-white/70'
      "
      @click="emit('update:scaleMode', 'actual')"
      title="Actual size (100%)"
    >
      1:1
    </button>
  </div>
</template>
