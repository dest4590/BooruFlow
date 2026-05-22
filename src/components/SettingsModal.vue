<script setup lang="ts">
import { ref } from "vue";
import { alwaysLoadHighRes, excludeAi } from "../composables/useSettings";
import BaseModal from "./BaseModal.vue";
import BaseSwitch from "./BaseSwitch.vue";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const localHighRes = ref(alwaysLoadHighRes.value);
const localExcludeAi = ref(excludeAi.value);

function handleClose() {
  alwaysLoadHighRes.value = localHighRes.value;
  excludeAi.value = localExcludeAi.value;
  emit("close");
}
</script>

<template>
  <BaseModal :open="open" title="Settings" @close="handleClose">
    <BaseSwitch
      v-model="localHighRes"
      label="Always Load High-Res"
      description="Load full resolution images instead of previews"
      color="#22c55e"
    />

    <BaseSwitch
      v-model="localExcludeAi"
      label="Exclude AI Content"
      description="Automatically exclude common AI tags from search"
      color="#3b82f6"
    />

    <template #footer>
      <button
        class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border border-app-border text-app-text-muted hover:border-app-text-dim hover:text-app-text bg-app-bg-2"
        @click="handleClose"
      >
        Done
      </button>
    </template>
  </BaseModal>
</template>
