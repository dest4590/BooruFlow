<script setup lang="ts">
import { Menu, X as CloseIcon } from "@lucide/vue";

defineProps<{
  showSidebar: boolean;
}>();

defineEmits<{
  "toggle-sidebar": [];
}>();
</script>

<template>
  <header
    class="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-app-bg/80 backdrop-blur-sm border-b border-app-border shrink-0"
  >
    <button
      class="p-2 -ml-2 text-app-text-dim hover:text-app-text transition-colors"
      @click="$emit('toggle-sidebar')"
    >
      <Menu v-if="!showSidebar" class="w-5 h-5" />
      <CloseIcon v-else class="w-5 h-5" />
    </button>
    <div class="flex items-center gap-4">
      <img src="/logo.png" alt="Logo" class="w-8 h-8" />
      <span class="text-2xl font-extrabold tracking-tight text-app-text"
        >Booru</span
      >
    </div>
    <div class="w-8"></div>
  </header>
</template>
