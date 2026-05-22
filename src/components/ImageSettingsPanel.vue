<script setup lang="ts">
defineProps<{
  scaleMode: "fit" | "actual";
  enableScrollMode: boolean;
}>();

const emit = defineEmits<{
  "update:scaleMode": ["fit" | "actual"];
  "update:enableScrollMode": [boolean];
}>();
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      class="absolute bottom-full right-0 mb-3 bg-black/80 border border-white/10 backdrop-blur-xl rounded-xl p-4 shadow-2xl z-50 min-w-55"
    >
      <div class="space-y-4">
        <div>
          <p
            class="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2.5"
          >
            View
          </p>
          <div class="flex gap-2">
            <button
              class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
              :class="
                scaleMode === 'fit'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/5 text-white/60 hover:text-white/80 border border-transparent hover:border-white/10'
              "
              @click="emit('update:scaleMode', 'fit')"
            >
              Fit
            </button>
            <button
              class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
              :class="
                scaleMode === 'actual'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/5 text-white/60 hover:text-white/80 border border-transparent hover:border-white/10'
              "
              @click="emit('update:scaleMode', 'actual')"
            >
              1:1
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-white/10">
          <p
            class="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2.5"
          >
            Scrolling
          </p>
          <button
            class="w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 border"
            :class="
              enableScrollMode
                ? 'bg-white/15 text-white border-white/20'
                : 'bg-white/5 text-white/60 hover:text-white/80 border-transparent hover:border-white/10'
            "
            @click="emit('update:enableScrollMode', !enableScrollMode)"
          >
            {{ enableScrollMode ? "Enabled" : "Disabled" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
