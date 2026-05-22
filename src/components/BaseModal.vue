<script setup lang="ts">
import { X as CloseIcon } from "@lucide/vue";

defineProps<{
  open: boolean;
  title: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport v-if="open" to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40"
      @click.self="$emit('close')"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
      >
        <div class="w-full max-w-md md:max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-app-bg-1 border border-app-border-deep">
          <div class="flex items-center justify-between px-6 py-4 border-b border-app-border">
            <h2 class="text-lg font-semibold text-app-text">
              {{ title }}
            </h2>
            <button
              class="p-2 rounded-xl transition-all hover:bg-app-bg-3 text-app-text-dim hover:text-app-text"
              @click="$emit('close')"
            >
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="px-6 py-6 space-y-4">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-app-border flex justify-end gap-3"
          >
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

