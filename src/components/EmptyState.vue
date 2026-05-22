<script setup lang="ts">
import { Menu, Loader2, AlertCircle } from "@lucide/vue";

defineProps<{
  hasSearched: boolean;
  loading?: boolean;
  error?: string | null;
  postCount?: number;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
  >
    <div
      v-if="!hasSearched || loading || error || postCount === 0"
      class="h-full flex flex-col items-center justify-center py-20"
    >
      <template v-if="!hasSearched">
        <div
          class="mb-8 w-24 h-24 rounded-4xl bg-app-bg-2 border border-app-border flex items-center justify-center shadow-inner"
        >
          <img src="/logo.png" alt="BooruFlow Logo" class="w-24 h-24" />
        </div>
        <p
          class="text-xl font-black uppercase tracking-[0.2em] text-app-text-dim"
        >
          BooruFlow
        </p>
        <p
          class="text-sm font-bold text-app-text-dim/40 mt-2 uppercase tracking-widest"
        >
          Type tags in the sidebar to begin
        </p>
      </template>

      <template v-else-if="loading">
        <div
          class="mb-8 w-24 h-24 rounded-4xl bg-app-bg-2 border border-app-border flex items-center justify-center shadow-inner"
        >
          <Loader2 class="w-10 h-10 text-app-text-dim/40 animate-spin" />
        </div>
        <p
          class="text-xl font-black uppercase tracking-[0.2em] text-app-text-dim"
        >
          Searching
        </p>
        <p
          class="text-sm font-bold text-app-text-dim/40 mt-2 uppercase tracking-widest"
        >
          Loading images...
        </p>
      </template>

      <template v-else-if="error">
        <div
          class="mb-8 w-24 h-24 rounded-4xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner"
        >
          <AlertCircle class="w-10 h-10 text-red-500/60" />
        </div>
        <p
          class="text-xl font-black uppercase tracking-[0.2em] text-red-500/80"
        >
          Search Failed
        </p>
        <p
          class="text-sm font-bold text-red-500/60 mt-2 uppercase tracking-widest"
        >
          {{ error }}
        </p>
      </template>

      <template v-else>
        <div
          class="mb-8 w-24 h-24 rounded-4xl bg-app-bg-2 border border-app-border flex items-center justify-center shadow-inner"
        >
          <Menu class="w-10 h-10 text-app-text-dim/40" />
        </div>
        <p
          class="text-xl font-black uppercase tracking-[0.2em] text-app-text-dim"
        >
          No Results
        </p>
        <p
          class="text-sm font-bold text-app-text-dim/40 mt-2 uppercase tracking-widest"
        >
          Try different tags
        </p>
      </template>
    </div>
  </Transition>
</template>
