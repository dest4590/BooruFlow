<script setup lang="ts">
import { X as CloseIcon, Settings, SlidersHorizontal, Share2 } from "@lucide/vue";
import SearchBar from "./SearchBar.vue";
import SfwToggle from "./SfwToggle.vue";
import type { BooruMode } from "../composables/useSettings";

defineProps<{
  showSidebar: boolean;
  query: string;
  mode: BooruMode;
  loading: boolean;
  filtersActive: boolean;
}>();

const emit = defineEmits<{
  "update:query": [value: string];
  "update:mode": [value: BooruMode];
  "close-sidebar": [];
  "open-filters": [];
  "open-settings": [];
  search: [];
  share: [];
}>();
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 w-96 transform transition-transform duration-250 ease-in-out md:relative md:translate-x-0 flex flex-col shrink-0 h-screen border-r border-app-border bg-app-bg-1',
      showSidebar ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="p-6 flex flex-col h-full overflow-hidden">
        <div class="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight leading-tight text-app-text">
            BooruFlow
          </h1>
          </div>
          <button
          class="md:hidden p-2 rounded-xl transition-all hover:bg-app-bg-3 text-app-text-dim hover:text-app-text"
          @click="$emit('close-sidebar')"
        >
          <CloseIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-8 flex-1 overflow-y-auto no-scrollbar">
        <section>
          <label
            class="text-[10px] font-bold uppercase tracking-widest text-app-text-dim mb-3 block px-1"
            >Search Tags</label
          >
          <SearchBar
            :model-value="query"
            :mode="mode"
            :loading="loading"
            @update:model-value="$emit('update:query', $event)"
            @search="$emit('search')"
          />
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <label
              class="text-[10px] font-bold uppercase tracking-widest text-app-text-dim"
              >Mode</label
            >
            <SfwToggle
              :model-value="mode"
              @update:model-value="$emit('update:mode', $event)"
            />
          </div>

          <button
            class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all border group"
            :class="
              filtersActive
                ? 'border-app-text bg-app-bg-3 shadow-sm'
                : 'border-app-border bg-app-bg-2 hover:bg-app-bg-3 hover:border-app-text-dim'
            "
            @click="$emit('open-filters')"
          >
            <div class="flex items-center gap-3">
              <SlidersHorizontal
                class="w-4 h-4 text-app-text-dim transition-colors group-hover:text-app-text"
                :class="{ 'text-app-text': filtersActive }"
              />
              <span class="text-sm font-bold" :class="filtersActive ? 'text-app-text' : 'text-app-text-muted'">Filters</span>
            </div>
            <div
              v-if="filtersActive"
              class="w-2 h-2 rounded-full bg-app-text shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            ></div>
          </button>

          <button
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border border-app-border bg-app-bg-2 hover:bg-app-bg-3 hover:border-app-text-dim group"
            @click="$emit('open-settings')"
          >
            <Settings
              class="w-4 h-4 text-app-text-dim transition-colors group-hover:text-app-text"
            />
            <span class="text-sm font-bold text-app-text-muted transition-colors group-hover:text-app-text">Settings</span>
          </button>

          <button
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border border-app-border bg-app-bg-2 hover:bg-app-bg-3 hover:border-app-text-dim group"
            @click="$emit('share')"
            title="Copy shareable link"
          >
            <Share2
              class="w-4 h-4 text-app-text-dim transition-colors group-hover:text-app-text"
            />
            <span class="text-sm font-bold text-app-text-muted transition-colors group-hover:text-app-text">Share</span>
          </button>
        </section>
      </div>

      <div
        <div class="mt-auto pt-4 border-t border-app-border text-[11px] text-app-text-dim text-center shrink-0 font-medium">
          by <a href="https://github.com/dest4590">@dest4590</a>
        </div>
    </div>
  </aside>

  <div
    v-if="showSidebar"
    class="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
    @click="$emit('close-sidebar')"
  ></div>
</template>
